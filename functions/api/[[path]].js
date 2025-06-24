import yaml from 'js-yaml';

// --- 全局配置 ---
const SUBVERTER_URL = 'api.v1.mk'; // 这是一个常用的、稳定的subconverter后端，您也可以替换为其他的

const PREDEFINED_RULES = {
    Lan: ['FINAL,DIRECT,dns-failed'],
    Apple: ['RULE-SET,apple,DIRECT'],
    Microsoft: ['RULE-SET,microsoft,DIRECT'],
    Google: ['RULE-SET,google,🚀 PROXY'],
    Proxy: ['RULE-SET,proxy,🚀 PROXY'],
    Cn: ['RULE-SET,cn,DIRECT'],
    Telegram: ['RULE-SET,telegram,🚀 PROXY'],
    Private: ['RULE-SET,private,DIRECT'],
    Domestic: ['RULE-SET,domestic,DIRECT'],
    Ads: ['RULE-SET,ads,REJECT']
};

const KV_KEY_NODES = 'prosub_nodes_v1';
const KV_KEY_PROFILES = 'prosub_profiles_v1';
const COOKIE_NAME = 'prosub_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000;

// --- 辅助函数 ---

async function createSignedToken(key, data) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const dataToSign = encoder.encode(data);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
    return `${data}.${Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

async function verifySignedToken(key, token) {
    if (!key || !token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data] = parts;
    const expectedToken = await createSignedToken(key, data);
    return token === expectedToken ? data : null;
}

async function authMiddleware(request, env) {
    if (!env.COOKIE_SECRET) {
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

function parseNodeToClashProxy(node) {
    if (!node || !node.url) return null;
    try {
        const url = new URL(node.url);
        const protocol = url.protocol.replace(':', '');
        switch (protocol) {
            case 'vmess': { const decoded = JSON.parse(atob(url.hostname)); return { name: node.name, type: 'vmess', server: decoded.add, port: parseInt(decoded.port, 10), uuid: decoded.id, alterId: decoded.aid, cipher: decoded.scy || 'auto', tls: decoded.tls === 'tls', 'skip-cert-verify': true, network: decoded.net, 'ws-opts': decoded.net === 'ws' ? { path: decoded.path, headers: { Host: decoded.host } } : undefined, };}
            case 'trojan': { return { name: node.name, type: 'trojan', server: url.hostname, port: parseInt(url.port, 10), password: url.username, sni: url.searchParams.get('sni') || url.hostname, 'skip-cert-verify': true, }; }
            case 'vless': { const sni = url.searchParams.get('sni') || url.hostname; return { name: node.name, type: 'vless', server: url.hostname, port: parseInt(url.port, 10), uuid: url.username, network: url.searchParams.get('type') || 'ws', tls: url.searchParams.get('security') === 'tls', 'skip-cert-verify': true, servername: sni, 'ws-opts': url.searchParams.get('type') === 'ws' ? { path: url.searchParams.get('path') || '/', headers: { Host: sni } } : undefined, }; }
            case 'ss': { const hashIndex = url.href.indexOf('#'); const mainPart = hashIndex !== -1 ? url.href.substring(0, hashIndex) : url.href; let userInfo, serverInfo; if (mainPart.includes('@')) { const parts = mainPart.replace('ss://', '').split('@'); userInfo = atob(parts[0]).split(':'); serverInfo = parts[1].split(':'); } else { const decoded = atob(mainPart.replace('ss://', '')); const atIndex = decoded.indexOf('@'); userInfo = decoded.substring(0, atIndex).split(':'); serverInfo = decoded.substring(atIndex + 1).split(':'); } return { name: node.name, type: 'ss', server: serverInfo[0], port: parseInt(serverInfo[1], 10), cipher: userInfo[0], password: userInfo[1], }; }
            default: return null;
        }
    } catch (error) { return null; }
}

function buildClashConfig(nodes, profile) {
    const proxies = nodes.map(parseNodeToClashProxy).filter(Boolean);
    const proxyNames = proxies.map(p => p.name);
    const finalConfig = {
        'port': 7890, 'socks-port': 7891, 'allow-lan': true, 'mode': 'rule', 'log-level': 'info', 'external-controller': '127.0.0.1:9090',
        'proxies': proxies,
        'proxy-groups': [ { name: '🚀 PROXY', type: 'select', proxies: ['SELECT', 'DIRECT', ...proxyNames] }, { name: 'SELECT', type: 'select', proxies: [...proxyNames, 'DIRECT'] }, { name: '🍎 Apple', type: 'select', proxies: ['DIRECT', '🚀 PROXY'] }, { name: 'Ⓜ️ Microsoft', type: 'select', proxies: ['DIRECT', '🚀 PROXY'] }, { name: '📲 Telegram', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, { name: '谷歌Goolge', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, { name: '国外网站', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, { name: '广告拦截', type: 'select', proxies: ['REJECT', 'DIRECT'] }, { name: '漏网之鱼', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, ],
        'rule-providers': { ads: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/BanAD.list", path: './ruleset/ads.list', interval: 86400 }, apple: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Apple.list", path: './ruleset/apple.list', interval: 86400 }, cn: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Ruleset/NetEaseMusic.list", path: './ruleset/cn.list', interval: 86400 }, google: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Ruleset/Google.list", path: './ruleset/google.list', interval: 86400 }, proxy: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Proxy.list", path: './ruleset/proxy.list', interval: 86400 }, private: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/LAN.list", path: './ruleset/private.list', interval: 86400 }, domestic: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Domestic.list", path: './ruleset/domestic.list', interval: 86400 }, telegram: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Ruleset/Telegram.list", path: './ruleset/telegram.list', interval: 86400 }, microsoft: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Microsoft.list", path: './ruleset/microsoft.list', interval: 86400 }, },
        'rules': [],
    };
    let finalRules = [];
    if (profile.userCustomRules && Array.isArray(profile.userCustomRules) && profile.userCustomRules.length > 0) { finalRules = [...finalRules, ...profile.userCustomRules]; }
    if (profile.selectedRuleSets && Array.isArray(profile.selectedRuleSets)) { profile.selectedRuleSets.forEach(ruleSetId => { if (PREDEFINED_RULES[ruleSetId]) { finalRules = [...finalRules, ...PREDEFINED_RULES[ruleSetId]]; } }); }
    finalConfig.rules = finalRules;
    finalConfig.rules.push('MATCH,漏网之鱼');
    return yaml.dump(finalConfig);
}

function parseNodeToV2rayOutbound(node) {
    try { const parsedDetails = parseNodeToClashProxy(node); if (!parsedDetails) return null; const protocol = parsedDetails.type; const settings = {}; const streamSettings = { network: parsedDetails.network, security: parsedDetails.tls ? 'tls' : 'none', tlsSettings: parsedDetails.tls ? { serverName: parsedDetails.servername || parsedDetails.server } : undefined, wsSettings: parsedDetails.network === 'ws' ? parsedDetails['ws-opts'] : undefined, }; switch (protocol) { case 'vmess': settings.vnext = [{ address: parsedDetails.server, port: parsedDetails.port, users: [{ id: parsedDetails.uuid, alterId: parsedDetails.alterId, security: parsedDetails.cipher }] }]; break; case 'vless': settings.vnext = [{ address: parsedDetails.server, port: parsedDetails.port, users: [{ id: parsedDetails.uuid, flow: 'xtls-rprx-vision' }] }]; break; case 'trojan': settings.servers = [{ address: parsedDetails.server, port: parsedDetails.port, password: parsedDetails.password }]; break; case 'ss': settings.servers = [{ address: parsedDetails.server, port: parsedDetails.port, method: parsedDetails.cipher, password: parsedDetails.password }]; break; default: return null; } return { tag: node.name, protocol, settings, streamSettings }; } catch (e) { return null; }
}

function buildV2rayConfig(nodes) {
    const outbounds = nodes.map(parseNodeToV2rayOutbound).filter(Boolean);
    const proxyTags = outbounds.map(o => o.tag);
    return JSON.stringify({ inbounds: [{ port: 10808, listen: '127.0.0.1', protocol: 'socks', settings: { auth: 'noauth', udp: true } }], outbounds: [{ tag: 'direct', protocol: 'freedom', settings: {} }, { tag: 'block', protocol: 'blackhole', settings: {} }, ...outbounds], routing: { domainStrategy: 'AsIs', rules: [ { type: 'field', ip: ['geoip:private'], outboundTag: 'direct' }, { type: 'field', domain: ['geosite:cn'], outboundTag: 'direct' }, { type: 'field', ip: ['geoip:cn'], outboundTag: 'direct' }, { type: 'field', port: '0-65535', outboundTag: proxyTags[0] || 'direct' } ] } }, null, 2);
}

// 【新增】一个可复用的函数，用于获取并解析一个Profile中的所有节点
async function resolveNodesForProfile(profile, env) {
    const nodesStr = await env.KV.get(KV_KEY_NODES);
    const allNodes = nodesStr ? JSON.parse(nodesStr) : [];
    const selectedNodesFromProfile = allNodes.filter(node => profile.nodeIds.includes(node.id));

    const processingPromises = selectedNodesFromProfile.map(async (node) => {
        if (node.url.startsWith('http')) {
            const cacheKey = `sub-cache:${node.url}`;
            const cached = await env.KV.get(cacheKey);
            if (cached) {
                const lines = cached.split(/\r?\n/).filter(Boolean);
                return lines.map((line, i) => ({ name: `${node.name}-${i}`, url: line.trim() }));
            }
            try {
                const response = await fetch(node.url, { headers: { 'User-Agent': 'ProSub/1.0' } });
                if (response.ok) {
                    const text = await response.text();
                    const decodedText = /^[a-zA-Z0-9+/=\s]+$/.test(text) && text.length % 4 === 0 ? atob(text) : text;
                    await env.KV.put(cacheKey, decodedText, { expirationTtl: 3600 });
                    const lines = decodedText.split(/\r?\n/).filter(Boolean);
                    return lines.map((line, i) => ({ name: `${node.name}-${i}`, url: line.trim() }));
                }
            } catch (e) { console.error(`Failed to fetch sub: ${node.url}`, e); return []; }
        } else {
            return [node];
        }
        return [];
    });

    const allResolvedNodesNested = await Promise.all(processingPromises);
    return allResolvedNodesNested.flat();
}

// --- 主请求处理函数 ---
export async function onRequest(context) {
    const { request, env } = context;
    const pathSegments = context.params.path;
    const resource = pathSegments[0];
    const id = pathSegments[1];
    const url = new URL(request.url);

    // --- 主订阅路由，智能调度中心 ---
    if (resource === 'subscribe' && id) {
        try {
            const profileId = id;
            const profilesStr = await env.KV.get(KV_KEY_PROFILES);
            const allProfiles = profilesStr ? JSON.parse(profilesStr) : [];
            const targetProfile = allProfiles.find(p => p.id === profileId);

            if (!targetProfile) return new Response('Profile not found', { status: 404 });

            const format = targetProfile.outputFormat.toLowerCase();
            const resolvedNodes = await resolveNodesForProfile(targetProfile, env);

            if (resolvedNodes.length === 0) {
                return new Response(`// No nodes found for this profile.`, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
            }

            let outputConfig = '';
            let contentType = 'text/plain; charset=utf-8';
            let fileExtension = 'txt';

            // 【核心修正】调度逻辑更新
            if (format === 'clash') {
                outputConfig = buildClashConfig(resolvedNodes, targetProfile);
                fileExtension = 'yaml';
            } else if (format === 'v2ray') {
                outputConfig = buildV2rayConfig(resolvedNodes);
                contentType = 'application/json; charset=utf-8';
                fileExtension = 'json';
            } else if (format === 'v2rayn') {
                // V2RayN需要纯粹的base64编码节点列表
                const nodeListString = resolvedNodes.map(n => n.url).join('\n');
                outputConfig = btoa(nodeListString);
            } else {
                // 其他格式(sing-box, loon, surge)通过外部subconverter处理
                const nodeListString = resolvedNodes.map(n => n.url).join('\n');
                const base64Nodes = btoa(nodeListString);
                // 直接将base64内容通过data URI传给subconverter，不再需要内部回调路由
                const callbackUrl = `data:text/plain;base64,${base64Nodes}`;
                
                const subconverterUrl = new URL(`https://${SUBVERTER_URL}/sub`);
                subconverterUrl.searchParams.set('target', format);
                subconverterUrl.searchParams.set('url', callbackUrl);
                subconverterUrl.searchParams.set('filename', targetProfile.name);

                console.log(`Forwarding to subconverter: ${subconverterUrl.toString()}`);
                return fetch(subconverterUrl.toString());
            }

            return new Response(outputConfig, {
                headers: { 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${encodeURIComponent(targetProfile.name)}.${fileExtension}"` },
            });

        } catch (error) {
            console.error('Subscription generation failed:', error);
            return new Response(`Backend Error: ${error.stack}`, { status: 500 });
        }
    }

    // --- 受保护的API路由 ---
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
    const handleCrud = async (kvKey, request, id) => {
        let data = await env.KV.get(kvKey);
        let items = data ? JSON.parse(data) : [];
        switch (request.method) {
            case 'GET': return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
            case 'POST': { const newItems = await request.json(); if (!Array.isArray(newItems)) { return new Response('Request body must be an array.', { status: 400 }); } await env.KV.put(kvKey, JSON.stringify(newItems)); return new Response(JSON.stringify({ success: true, count: newItems.length })); }
            case 'PUT': { if (!id) return new Response('ID is required for update', { status: 400 }); const updatedItem = await request.json(); const itemIndex = items.findIndex(item => item.id === id); if (itemIndex === -1) { return new Response('Item not found', { status: 404 }); } items[itemIndex] = { ...updatedItem, id: id }; await env.KV.put(kvKey, JSON.stringify(items)); return new Response(JSON.stringify(items[itemIndex])); }
            case 'DELETE': { if (!id) return new Response('ID required', { status: 400 }); const remainingItems = items.filter(item => item.id !== id); await env.KV.put(kvKey, JSON.stringify(remainingItems)); return new Response(null, { status: 204 }); }
            default: return new Response('Method Not Allowed', { status: 405 });
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