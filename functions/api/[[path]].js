import yaml from 'js-yaml';

// --- KV 存储的 Key ---
const KV_KEY_NODES = 'prosub_nodes_v1';
const KV_KEY_PROFILES = 'prosub_profiles_v1';

// --- 【新增】认证与会话常量 ---
const COOKIE_NAME = 'prosub_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8小时

// --- 【新增】认证核心函数 ---

// 创建一个带有HMAC签名的Token
async function createSignedToken(key, data) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const dataToSign = encoder.encode(data);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
    return `${data}.${Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

// 验证一个带有HMAC签名的Token
async function verifySignedToken(key, token) {
    if (!key || !token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data] = parts;
    const expectedToken = await createSignedToken(key, data);
    return token === expectedToken ? data : null;
}

// 认证中间件，检查请求的Cookie是否有效
async function authMiddleware(request, env) {
    if (!env.COOKIE_SECRET) {
        console.error("COOKIE_SECRET is not set!");
        return false;
    }
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return false;

    const cookies = cookieHeader.split(';').map(c => c.trim());
    const sessionCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
    if (!sessionCookie) return false;
    
    const token = sessionCookie.split('=')[1];
    const verifiedData = await verifySignedToken(env.COOKIE_SECRET, token);
    
    return verifiedData && (Date.now() - parseInt(verifiedData, 10) < SESSION_DURATION);
}


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
 * @param {string|null} remoteConfigContent - （新增）远程配置文件的文本内容
 * @returns {string} - YAML 格式的 Clash 配置
 */
function buildClashConfig(nodes, profile, remoteConfigContent) {
    const proxies = nodes.map(parseNodeToClashProxy).filter(Boolean);
    const proxyNames = proxies.map(p => p.name);

    // 基础配置
    let finalConfig = {
        'proxies': proxies,
        'proxy-groups': [
            {
                name: "🚀 PROXY",
                type: "select",
                proxies: ["DIRECT", "REJECT", ...proxyNames],
            },
        ],
        'rules': [], // 规则留空，等待合并
    };

    // 如果存在远程配置内容，则进行合并
    if (remoteConfigContent) {
        try {
            const remoteConfig = yaml.load(remoteConfigContent);
            // 使用扩展运算符进行智能合并
            finalConfig = { ...finalConfig, ...remoteConfig };
            
            // 特殊处理 proxy-groups 和 rules，进行追加而不是完全覆盖
            // 确保我们自己生成的 PROXY 组始终存在
            if (remoteConfig['proxy-groups']) {
                finalConfig['proxy-groups'] = [
                    ...finalConfig['proxy-groups'], 
                    ...remoteConfig['proxy-groups']
                ];
            }
            if (remoteConfig['rules']) {
                // 将远程规则放在前面
                finalConfig['rules'] = [
                    ...remoteConfig['rules'],
                ];
            }
        } catch (e) {
            console.error("Failed to parse remote config YAML:", e);
        }
    }
    
    // 始终在规则列表末尾添加 MATCH 规则，确保全覆盖
    finalConfig.rules.push('MATCH,🚀 PROXY');

    return yaml.dump(finalConfig);
}


// --- 主请求处理函数 ---
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // --- 订阅链接生成路由 (无需认证) ---
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
            
            let remoteConfigContent = null;
            if (targetProfile.remoteConfig && targetProfile.remoteConfig.startsWith('http')) {
                try {
                    console.log(`Fetching remote config from: ${targetProfile.remoteConfig}`);
                    const configResponse = await fetch(targetProfile.remoteConfig);
                    if (configResponse.ok) {
                        remoteConfigContent = await configResponse.text();
                    }
                } catch (e) {
                    console.error("Failed to fetch remote config:", e);
                }
            }
            
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

            const outputConfig = buildClashConfig(resolvedNodes, targetProfile, remoteConfigContent);

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

    // --- API 路由处理 (需要认证) ---
    if (url.pathname.startsWith('/api/')) {
        const pathParts = context.params.path;
        const resource = pathParts[0];
        const id = pathParts[1]; // 获取ID

        if (resource === 'login' && request.method === 'POST') {
            try {
                const { password } = await request.json();
                if (password === env.ADMIN_PASSWORD) {
                    const token = await createSignedToken(env.COOKIE_SECRET, String(Date.now()));
                    const headers = new Headers({ 'Content-Type': 'application/json' });
                    headers.append('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION / 1000}`);
                    return new Response(JSON.stringify({ success: true }), { headers });
                }
                return new Response(JSON.stringify({ error: '密码错误' }), { status: 401 });
            } catch (e) {
                return new Response(JSON.stringify({ error: '登录请求无效' }), { status: 400 });
            }
        }

        const isAuthed = await authMiddleware(request, env);
        if (!isAuthed) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        if (resource === 'logout' && request.method === 'POST') {
            const headers = new Headers({ 'Content-Type': 'application/json' });
            headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // 统一的CRUD处理器
        const handleCrud = async (kvKey, request, id) => {
            let data = await env.KV.get(kvKey);
            let items = data ? JSON.parse(data) : [];

            switch (request.method) {
                case 'GET':
                    return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
                case 'POST': {
                    const newItems = await request.json();
                    if (!Array.isArray(newItems)) {
                        return new Response('Request body must be an array.', { status: 400 });
                    }
                    await env.KV.put(kvKey, JSON.stringify(newItems));
                    return new Response(JSON.stringify({ success: true, count: newItems.length }));
                }
                case 'DELETE':
                    if (!id) return new Response('ID required', { status: 400 });
                    const remainingItems = items.filter(item => item.id !== id);
                    await env.KV.put(kvKey, JSON.stringify(remainingItems));
                    return new Response(null, { status: 204 }); // 204 No Content
                default:
                    return new Response('Method Not Allowed', { status: 405 });
            }
        };

        if (resource === 'nodes') {
            return handleCrud(KV_KEY_NODES, request, id);
        }
        if (resource === 'profiles') {
            return handleCrud(KV_KEY_PROFILES, request, id);
        }

       return new Response('API route not found', { status: 404 });
    }

        // 在 functions/api/[[path]].js 中找到并替换 handleCrud 函数

        const handleCrud = async (kvKey, request, id) => {
            let data = await env.KV.get(kvKey);
            let items = data ? JSON.parse(data) : [];

            switch (request.method) {
                case 'GET':
                    return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });

                case 'POST': {
                    // 【修改】这里的逻辑现在是“完全替换”而不是“追加”
                    const newItems = await request.json();
                    if (!Array.isArray(newItems)) {
                        return new Response('Request body must be an array.', { status: 400 });
                    }
                    await env.KV.put(kvKey, JSON.stringify(newItems));
                    return new Response(JSON.stringify({ success: true, count: newItems.length }));
                }

                case 'DELETE':
                    if (!id) return new Response('ID required', { status: 400 });
                    const remainingItems = items.filter(item => item.id !== id);
                    await env.KV.put(kvKey, JSON.stringify(remainingItems));
                    return new Response(null, { status: 204 });

                default:
                    return new Response('Method Not Allowed', { status: 405 });
            }
        };

        // 同时，需要修改onRequest中对handleCrud的调用方式
        // 在 if (resource === 'nodes') { ... } 中，调用改为:
        // return handleCrud(KV_KEY_NODES, request, id);
        // 在 if (resource === 'profiles') { ... } 中，调用改为:
        // return handleCrud(KV_KEY_PROFILES, request, id);

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