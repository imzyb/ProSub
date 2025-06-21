// functions/api/[[path]].js

import yaml from 'js-yaml';

// --- KV 存储的 Key ---
const KV_KEY_NODES = 'prosub_nodes_v1';
const KV_KEY_PROFILES = 'prosub_profiles_v1';


// --- 核心转换逻辑 ---

/**
 * 解析单个节点链接，返回 Clash Proxy Object
 * @param {object} node - 包含 name 和 url 的节点对象
 * @returns {object|null} - Clash Proxy 对象或 null
 */
function parseNodeToClashProxy(node) {
    if (!node || !node.url) return null;

    try {
        const url = new URL(node.url);
        const protocol = url.protocol.replace(':', '');

        switch (protocol) {
            case 'vmess': {
                const decoded = JSON.parse(atob(url.hostname));
                return {
                    name: node.name,
                    type: 'vmess',
                    server: decoded.add,
                    port: parseInt(decoded.port, 10),
                    uuid: decoded.id,
                    alterId: decoded.aid,
                    cipher: decoded.scy || 'auto',
                    tls: decoded.tls === 'tls',
                    'skip-cert-verify': true,
                    network: decoded.net,
                    'ws-opts': decoded.net === 'ws' ? { path: decoded.path, headers: { Host: decoded.host } } : undefined,
                };
            }
            case 'trojan': {
                return {
                    name: node.name,
                    type: 'trojan',
                    server: url.hostname,
                    port: parseInt(url.port, 10),
                    password: url.username,
                    sni: url.searchParams.get('sni') || url.hostname,
                    'skip-cert-verify': true,
                };
            }
            case 'vless': {
                const sni = url.searchParams.get('sni') || url.hostname;
                return {
                    name: node.name,
                    type: 'vless',
                    server: url.hostname,
                    port: parseInt(url.port, 10),
                    uuid: url.username,
                    network: url.searchParams.get('type') || 'ws', // 默认为 ws
                    tls: url.searchParams.get('security') === 'tls',
                    'skip-cert-verify': true,
                    servername: sni, // for sni
                    'ws-opts': url.searchParams.get('type') === 'ws' ? {
                        path: url.searchParams.get('path') || '/',
                        headers: { Host: sni }
                    } : undefined,
                };
            }
            case 'ss': {
                const hashIndex = url.href.indexOf('#');
                const mainPart = hashIndex !== -1 ? url.href.substring(0, hashIndex) : url.href;
                
                let userInfo, serverInfo;
                if (mainPart.includes('@')) {
                    // 格式: ss://method:password@server:port (需要base64解码用户信息部分)
                    const parts = mainPart.replace('ss://', '').split('@');
                    userInfo = atob(parts[0]).split(':');
                    serverInfo = parts[1].split(':');
                } else {
                    // 格式: ss://BASE64ENCODED(method:password@server:port)
                    const decoded = atob(mainPart.replace('ss://', ''));
                    const atIndex = decoded.indexOf('@');
                    userInfo = decoded.substring(0, atIndex).split(':');
                    serverInfo = decoded.substring(atIndex + 1).split(':');
                }

                return {
                    name: node.name,
                    type: 'ss',
                    server: serverInfo[0],
                    port: parseInt(serverInfo[1], 10),
                    cipher: userInfo[0],
                    password: userInfo[1],
                };
            }
            default:
                console.warn(`Unsupported protocol for Clash conversion: ${protocol}`);
                return null;
        }
    } catch (error) {
        console.error(`Failed to parse node: ${node.name} (${node.url})`, error);
        return null;
    }
}

/**
 * 根据节点列表和 Profile 设置，构建 Clash 配置文本
 * @param {Array<object>} nodes - 经过筛选的节点对象数组
 * @param {object} profile - 输出配置对象
 * @returns {string} - YAML 格式的 Clash 配置
 */
function buildClashConfig(nodes, profile) {
    const proxies = nodes.map(parseNodeToClashProxy).filter(Boolean);
    const proxyNames = proxies.map(p => p.name);

    const clashConfig = {
        'port': 7890,
        'socks-port': 7891,
        'allow-lan': false,
        'mode': 'rule',
        'log-level': 'info',
        'external-controller': '127.0.0.1:9090',
        'proxies': proxies,
        'proxy-groups': [
            {
                name: "🚀 PROXY",
                type: "select",
                proxies: ["DIRECT", "REJECT", ...proxyNames],
            },
        ],
        'rules': [
            'MATCH,🚀 PROXY'
        ],
    };

    return yaml.dump(clashConfig);
}

// --- 主请求处理函数 ---
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // --- 订阅链接生成路由 ---
    if (url.pathname.startsWith('/subscribe/')) {
        const profileId = url.pathname.split('/')[2];
        if (!profileId) return new Response('Profile ID is missing', { status: 400 });

        try {
            const profilesStr = await env.KV.get(KV_KEY_PROFILES);
            const allProfiles = profilesStr ? JSON.parse(profilesStr) : [];
            const targetProfile = allProfiles.find(p => p.id === profileId);

            if (!targetProfile) return new Response('Profile not found', { status: 404 });

            const nodesStr = await env.KV.get(KV_KEY_NODES);
            const allNodes = nodesStr ? JSON.parse(nodesStr) : [];
            
            const selectedNodesFromProfile = allNodes.filter(node => targetProfile.nodeIds.includes(node.id));
            
            let resolvedNodes = [];

            const processingPromises = selectedNodesFromProfile.map(async (node) => {
                if (node.url.startsWith('http')) {
                    try {
                        console.log(`Fetching remote subscription: ${node.name}`);
                        const response = await fetch(node.url, { headers: { 'User-Agent': 'ProSub/1.0' } });

                        if (response.ok) {
                            const text = await response.text();
                            const isBase64 = /^[a-zA-Z0-9+/=\s]+$/.test(text) && text.length % 4 === 0;
                            const decodedText = isBase64 ? atob(text) : text;
                            const lines = decodedText.split(/\r?\n/).filter(line => line.trim());
                            const nodesFromSub = lines.map((line, index) => ({
                                name: `${node.name} - ${index + 1}`,
                                url: line.trim()
                            }));
                            return nodesFromSub;
                        }
                    } catch (e) {
                        console.error(`Failed to fetch or parse subscription ${node.name}:`, e);
                        return [];
                    }
                } else {
                    return [node];
                }
                return [];
            });

            const allResolvedNodesNested = await Promise.all(processingPromises);
            resolvedNodes = allResolvedNodesNested.flat();

            const outputConfig = buildClashConfig(resolvedNodes, targetProfile);

            return new Response(outputConfig, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${encodeURIComponent(targetProfile.name)}.yaml"`
                },
            });

        } catch (error) {
            console.error('Subscription generation failed:', error);
            return new Response('Failed to generate subscription', { status: 500 });
        }
    }

    // --- API 路由处理 ---
    if (url.pathname.startsWith('/api/')) {
        const pathParts = context.params.path;
        const resource = pathParts[0];

        const handleCrud = async (kvKey) => {
            const id = pathParts[1];
            let data = await env.KV.get(kvKey);
            let items = data ? JSON.parse(data) : [];

            switch (request.method) {
                case 'GET':
                    return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
                case 'POST':
                    const newItem = await request.json();
                    newItem.id = crypto.randomUUID();
                    items.push(newItem);
                    await env.KV.put(kvKey, JSON.stringify(items));
                    return new Response(JSON.stringify(newItem), { status: 201 });
                case 'DELETE':
                    if (!id) return new Response('ID required', { status: 400 });
                    const remainingItems = items.filter(item => item.id !== id);
                    await env.KV.put(kvKey, JSON.stringify(remainingItems));
                    return new Response(null, { status: 204 });
                default:
                    return new Response('Method Not Allowed', { status: 405 });
            }
        };

        if (resource === 'nodes') {
            return handleCrud(KV_KEY_NODES);
        }
        if (resource === 'profiles') {
            return handleCrud(KV_KEY_PROFILES);
        }

        return new Response('API route not found', { status: 404 });
    }

    // --- 静态文件服务 ---
    return env.ASSETS.fetch(request);
}