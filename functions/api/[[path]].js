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
                    port: decoded.port,
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
                    port: url.port,
                    password: url.username,
                    sni: url.searchParams.get('sni') || url.hostname,
                    'skip-cert-verify': true,
                };
            }
            // --- 【新增】VLESS 协议支持 ---
            case 'vless': {
                const sni = url.searchParams.get('sni') || url.hostname;
                const wsPath = url.searchParams.get('path') || '/';
                return {
                    name: node.name,
                    type: 'vless',
                    server: url.hostname,
                    port: url.port,
                    uuid: url.username,
                    network: url.searchParams.get('type') || 'ws', // 默认为 ws
                    tls: url.searchParams.get('security') === 'tls',
                    'skip-cert-verify': true,
                    servername: sni,
                    'ws-opts': {
                        path: wsPath,
                        headers: { Host: sni }
                    }
                };
            }
            // --- 【新增】Shadowsocks (SS) 协议支持 ---
            case 'ss': {
                // SS 链接有两种格式: a) base64   b) user:pass@server:port
                const hashIndex = url.href.indexOf('#');
                const fragment = hashIndex !== -1 ? url.href.substring(hashIndex) : '';
                const mainPart = hashIndex !== -1 ? url.href.substring(0, hashIndex) : url.href;

                let userInfo, serverInfo;
                if (mainPart.includes('@')) {
                    // 格式 b)
                    const parts = mainPart.replace('ss://', '').split('@');
                    userInfo = atob(parts[0]).split(':'); // method:password
                    serverInfo = parts[1].split(':');
                } else {
                    // 格式 a)
                    const decoded = atob(mainPart.replace('ss://', ''));
                    const parts = decoded.split('@');
                    userInfo = parts[0].split(':');
                    serverInfo = parts[1].split(':');
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
                console.warn(`Unsupported protocol: ${protocol}`);
                return null; // 不支持的协议
        }
    } catch (error) {
        console.error(`Failed to parse node: ${node.name}`, error);
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
    // 1. 解析所有节点，生成 proxy 定义
    const proxies = nodes.map(parseNodeToClashProxy).filter(Boolean); // 过滤掉解析失败的 (null)
    const proxyNames = proxies.map(p => p.name);

    // 2. 构建 Clash 配置对象
    const clashConfig = {
        'port': 7890,
        'socks-port': 7891,
        'allow-lan': false,
        'mode': 'rule',
        'log-level': 'info',
        'external-controller': '127.0.0.1:9090',
        'proxies': proxies, // 放入解析好的 proxies
        'proxy-groups': [
            {
                name: "🚀 PROXY",
                type: "select",
                proxies: ["DIRECT", "REJECT", ...proxyNames],
            },
            // 在这里可以添加更多自定义的 proxy-groups
        ],
        'rules': [
            'MATCH,🚀 PROXY' // 默认所有流量走代理
        ],
    };

    // 3. 使用 js-yaml 将对象转换为 YAML 字符串
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
            
            const selectedNodes = allNodes.filter(node => targetProfile.nodeIds.includes(node.id));
            
            // 在 /subscribe/:profileId 路由处理逻辑中

            try {
                // ... (获取 profile 和 allNodes 的代码不变)

                let resolvedNodes = [];

                // 遍历 Profile 选择的所有节点
                for (const node of selectedNodes) {
                    // 如果是订阅链接 (http/https)
                    if (node.url.startsWith('http')) {
                        try {
                            console.log(`Fetching remote subscription: ${node.name}`);
                            const response = await fetch(node.url);
                            if (response.ok) {
                                const text = await response.text();
                                // 解码 Base64 (如果需要)
                                const decodedText = text.match(/^[a-zA-Z0-9+/=]+$/) ? atob(text) : text;
                                // 按行分割，解析每一行作为一个新节点
                                const lines = decodedText.split(/\r?\n/);
                                for (const line of lines) {
                                    if (line.trim()) {
                                        // 为解析出的节点创建一个临时对象
                                        // 注意：我们暂时无法获取远程节点的真实名称，可以用订阅名作为前缀
                                        resolvedNodes.push({ name: `${node.name} - ${line.slice(0, 10)}`, url: line.trim() });
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`Failed to fetch or parse subscription ${node.name}:`, e);
                        }
                    } else {
                        // 如果是手动添加的节点，直接加入
                        resolvedNodes.push(node);
                    }
                }

                // 调用我们自己的转换函数，传入处理过的节点列表
                const outputConfig = buildClashConfig(resolvedNodes, targetProfile);

                // ... (返回响应的代码不变)
            } catch (error) {
                // ...
            }
            // 调用我们自己的转换函数
            const outputConfig = buildClashConfig(selectedNodes, targetProfile);

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

        // 统一处理 CRUD 的逻辑
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