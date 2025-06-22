// src/utils.js

/**
 * 解析一个分享链接，返回其结构化信息
 * @param {string} url - 节点分享链接
 * @returns {object|null} - 包含协议、地址、端口等信息的对象，或解析失败时返回null
 */
export function parseNodeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    url = url.trim();

    try {
        // 1. 优先手动解析出协议头和 # 后面的备注
        const hashIndex = url.indexOf('#');
        const remark = hashIndex !== -1 ? decodeURIComponent(url.substring(hashIndex + 1)).trim() : '';

        const protocolEndIndex = url.indexOf('://');
        if (protocolEndIndex === -1) return { protocol: 'unknown', name: remark || '未知链接', remark };

        const protocol = url.substring(0, protocolEndIndex);

        let details = {
            protocol,
            name: remark || '未命名', // 默认使用 # 后面的备注作为名称
            remark: remark,
        };

        // 2. 根据不同协议进行精细化解析
        switch (protocol) {
            case 'vmess': {
                const mainPart = url.substring(protocolEndIndex + 3, hashIndex > -1 ? hashIndex : undefined);
                const decoded = JSON.parse(atob(mainPart));
                // 如果vmess链接内部有 "ps" 字段，优先使用它作为节点名称
                if (decoded.ps) {
                    details.name = decoded.ps.trim();
                }
                details = { ...details, ...decoded, address: decoded.add };
                break;
            }
            case 'vless':
            case 'trojan':
            case 'hysteria2': { // 将 hysteria2 加入标准解析流程
                // 使用 http 协议头来辅助 new URL() 解析
                const tempUrl = new URL('http' + url.substring(protocolEndIndex));
                details.address = tempUrl.hostname;
                details.port = tempUrl.port;
                details.uuid = tempUrl.username; // for vless
                details.password = tempUrl.username; // for trojan & hysteria2
                details.sni = tempUrl.searchParams.get('sni');
                // ... 可根据需要解析更多参数
                break;
            }
            case 'ss': {
                const mainPart = parsedUrl.href.substring(parsedUrl.protocol.length + 2).split('#')[0];
                if (mainPart.includes('@')) {
                    const parts = mainPart.split('@');
                    const creds = atob(parts[0]).split(':');
                    details.cipher = creds[0];
                    details.password = creds[1];
                    details.address = parts[1].split(':')[0];
                    details.port = parts[1].split(':')[1];
                } else {
                    const decoded = atob(mainPart);
                    const atIndex = decoded.indexOf('@');
                    const creds = decoded.substring(0, atIndex).split(':');
                    const server = decoded.substring(atIndex + 1).split(':');
                    details.cipher = creds[0];
                    details.password = creds[1];
                    details.address = server[0];
                    details.port = server[1];
                }
                break;
            }
            default:
                if (url.startsWith('http')) {
                    const httpUrl = new URL(url);
                    details.type = 'Subscription';
                    details.name = remark || httpUrl.hostname;
                } else {
                     details.name = remark || '未知链接';
                }
        }
        return details;
    } catch (e) {
        console.error('解析节点URL失败:', e);
        // 即使解析失败，也尝试返回基础信息
        const hashIndex = url.indexOf('#');
        const remark = hashIndex !== -1 ? decodeURIComponent(url.substring(hashIndex + 1)).trim() : '解析失败的链接';
        return { protocol: 'error', name: remark, url };
    }
}