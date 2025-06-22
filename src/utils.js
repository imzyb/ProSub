// src/utils.js

/**
 * 解析一个分享链接，返回其结构化信息
 * @param {string} url - 节点分享链接
 * @returns {object|null} - 包含协议、地址、端口等信息的对象，或解析失败时返回null
 */
export function parseNodeUrl(url) {
    if (!url) return null;
    try {
        const parsedUrl = new URL(url);
        const protocol = parsedUrl.protocol.replace(':', '');
        
        // 【关键】确保能解析出 remark/fragment
        const remark = decodeURIComponent(parsedUrl.hash.substring(1));

        let details = {
            protocol,
            name: remark || '未命名', // 优先使用remark作为name
            remark: remark,
        };

        switch (protocol) {
            case 'vmess': {
                const decoded = JSON.parse(atob(parsedUrl.hostname));
                details = { ...details, ...decoded, address: decoded.add };
                break;
            }
            case 'vless':
            case 'trojan': {
                details.address = parsedUrl.hostname;
                details.port = parsedUrl.port;
                details.uuid = parsedUrl.username; // for vless
                details.password = parsedUrl.username; // for trojan
                details.sni = parsedUrl.searchParams.get('sni');
                details.network = parsedUrl.searchParams.get('type');
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
                    details.type = 'Subscription';
                    details.url = url;
                } else {
                     return { protocol: 'unknown', name: '无法解析的链接', url };
                }
        }
        return details;
    } catch (e) {
        console.error('Parsing node URL failed:', e);
        return { protocol: 'error', name: '解析失败', url };
    }
}