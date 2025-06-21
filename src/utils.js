// src/utils.js

/**
 * 从节点或订阅链接中提取一个友好的名称
 * @param {string} url 节点或订阅的URL
 * @returns {string} 提取出的名称，如果失败则返回空字符串
 */
export function extractNodeName(url) {
    if (!url) return '';
    url = url.trim();
    try {
        // 优先从 # 后面的 fragment 获取名称
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1 && hashIndex < url.length - 1) {
            return decodeURIComponent(url.substring(hashIndex + 1)).trim();
        }

        // 如果没有 fragment，则根据协议和域名生成一个名称
        const a = new URL(url);
        if (a.protocol === 'http:' || a.protocol === 'https:') {
            return a.hostname; // http订阅直接返回域名
        }
        // 对于vless/trojan等，也返回域名
        return a.hostname || '未命名节点';

    } catch (e) {
        // 如果URL解析失败，返回空字符串
        console.error("Failed to extract node name from URL:", url, e);
        return '';
    }
}