function parseNodeToClashProxy(node) {
    try {
        if (!node || !node.url) return null;
        const url = new URL(node.url);
        const protocol = url.protocol.replace(':', '');
        switch (protocol) {
            case 'vmess': { const decoded = JSON.parse(atob(url.hostname)); return { name: node.name, type: 'vmess', server: decoded.add, port: parseInt(decoded.port, 10), uuid: decoded.id, alterId: decoded.aid, cipher: decoded.scy || 'auto', tls: decoded.tls === 'tls', 'skip-cert-verify': true, network: decoded.net, 'ws-opts': decoded.net === 'ws' ? { path: decoded.path, headers: { Host: decoded.host } } : undefined, }; }
            case 'trojan': { return { name: node.name, type: 'trojan', server: url.hostname, port: parseInt(url.port, 10), password: url.username, sni: url.searchParams.get('sni') || url.hostname, 'skip-cert-verify': true, }; }
            case 'vless': { const sni = url.searchParams.get('sni') || url.hostname; return { name: node.name, type: 'vless', server: url.hostname, port: parseInt(url.port, 10), uuid: url.username, network: url.searchParams.get('type') || 'ws', tls: url.searchParams.get('security') === 'tls', 'skip-cert-verify': true, servername: sni, 'ws-opts': url.searchParams.get('type') === 'ws' ? { path: url.searchParams.get('path') || '/', headers: { Host: sni } } : undefined, }; }
            case 'ss': { const hashIndex = url.href.indexOf('#'); const mainPart = hashIndex !== -1 ? url.href.substring(0, hashIndex) : url.href; let userInfo, serverInfo; if (mainPart.includes('@')) { const parts = mainPart.replace('ss://', '').split('@'); userInfo = atob(parts[0]).split(':'); serverInfo = parts[1].split(':'); } else { const decoded = atob(mainPart.replace('ss://', '')); const atIndex = decoded.indexOf('@'); userInfo = decoded.substring(0, atIndex).split(':'); serverInfo = decoded.substring(atIndex + 1).split(':'); } return { name: node.name, type: 'ss', server: serverInfo[0], port: parseInt(serverInfo[1], 10), cipher: userInfo[0], password: userInfo[1], }; }
            default: return null;
        }
    } catch (error) { return null; }
}
function parseNodeToV2rayOutbound(node) {
    try { const parsedDetails = parseNodeToClashProxy(node); if (!parsedDetails) return null; const protocol = parsedDetails.type; const settings = {}; const streamSettings = { network: parsedDetails.network, security: parsedDetails.tls ? 'tls' : 'none', tlsSettings: parsedDetails.tls ? { serverName: parsedDetails.servername || parsedDetails.server } : undefined, wsSettings: parsedDetails.network === 'ws' ? parsedDetails['ws-opts'] : undefined, }; switch (protocol) { case 'vmess': settings.vnext = [{ address: parsedDetails.server, port: parsedDetails.port, users: [{ id: parsedDetails.uuid, alterId: parsedDetails.alterId, security: parsedDetails.cipher }] }]; break; case 'vless': settings.vnext = [{ address: parsedDetails.server, port: parsedDetails.port, users: [{ id: parsedDetails.uuid, flow: 'xtls-rprx-vision' }] }]; break; case 'trojan': settings.servers = [{ address: parsedDetails.server, port: parsedDetails.port, password: parsedDetails.password }]; break; case 'ss': settings.servers = [{ address: parsedDetails.server, port: parsedDetails.port, method: parsedDetails.cipher, password: parsedDetails.password }]; break; default: return null; } return { tag: node.name, protocol, settings, streamSettings }; } catch (e) { return null; }
}

async function resolveNodesForProfile(profile, env) {
    const nodesStr = await env.KV.get(KV_KEY_NODES);
    const allNodes = nodesStr ? JSON.parse(nodesStr) : [];
    const selectedNodes = allNodes.filter(node => profile.nodeIds.includes(node.id));
    const processingPromises = selectedNodes.map(async (node) => {
        if (node.url.startsWith('http')) {
            const cacheKey = `sub-cache:${node.url}`;
            const cached = await env.KV.get(cacheKey);
            if (cached) { return cached.split(/\r?\n/).filter(Boolean).map((line, i) => ({ name: `${node.name}-${i}`, url: line.trim() })); }
            try { const response = await fetch(node.url, { headers: { 'User-Agent': 'ProSub/1.0' } }); if (response.ok) { const text = await response.text(); const decodedText = /^[a-zA-Z0-9+/=\s]+$/.test(text) && text.length % 4 === 0 ? atob(text) : text; await env.KV.put(cacheKey, decodedText, { expirationTtl: 3600 }); return decodedText.split(/\r?\n/).filter(Boolean).map((line, i) => ({ name: `${node.name}-${i}`, url: line.trim() })); } } catch (e) { return []; }
        } else { return [node]; }
        return [];
    });
    return (await Promise.all(processingPromises)).flat();
}