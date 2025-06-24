import yaml from 'js-yaml';
import { PREDEFINED_RULES } from './constants.js';
import { parseNodeToClashProxy, parseNodeToV2rayOutbound } from './parsers.js';
function buildClashConfig(nodes, profile) {
    const proxies = nodes.map(parseNodeToClashProxy).filter(Boolean);
    const proxyNames = proxies.map(p => p.name);
    const finalConfig = { 'port': 7890, 'socks-port': 7891, 'allow-lan': true, 'mode': 'rule', 'log-level': 'info', 'external-controller': '127.0.0.1:9090', 'proxies': proxies, 'proxy-groups': [ { name: '🚀 PROXY', type: 'select', proxies: ['SELECT', 'DIRECT', ...proxyNames] }, { name: 'SELECT', type: 'select', proxies: [...proxyNames, 'DIRECT'] }, { name: '🍎 Apple', type: 'select', proxies: ['DIRECT', '🚀 PROXY'] }, { name: 'Ⓜ️ Microsoft', type: 'select', proxies: ['DIRECT', '🚀 PROXY'] }, { name: '📲 Telegram', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, { name: '谷歌Goolge', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, { name: '国外网站', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, { name: '广告拦截', type: 'select', proxies: ['REJECT', 'DIRECT'] }, { name: '漏网之鱼', type: 'select', proxies: ['🚀 PROXY', 'DIRECT'] }, ], 'rule-providers': { ads: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/BanAD.list", path: './ruleset/ads.list', interval: 86400 }, apple: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Apple.list", path: './ruleset/apple.list', interval: 86400 }, microsoft: { type: 'http', behavior: 'domain', url: "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@latest/Clash/Microsoft.list", path: './ruleset/microsoft.list', interval: 86400 }, }, 'rules': [], };
    let finalRules = [];
    if (profile.userCustomRules && profile.userCustomRules.length > 0) { finalRules.push(...profile.userCustomRules); }
    if (profile.selectedRuleSets && profile.selectedRuleSets.length > 0) { profile.selectedRuleSets.forEach(id => finalRules.push(...(PREDEFINED_RULES[id] || []))); }
    finalConfig.rules = finalRules;
    finalConfig.rules.push('MATCH,漏网之鱼');
    return yaml.dump(finalConfig);
}
function buildV2rayConfig(nodes) {
    const outbounds = nodes.map(parseNodeToV2rayOutbound).filter(Boolean);
    const proxyTags = outbounds.map(o => o.tag);
    return JSON.stringify({ inbounds: [{ port: 10808, listen: '127.0.0.1', protocol: 'socks', settings: { auth: 'noauth', udp: true } }], outbounds: [{ tag: 'direct', protocol: 'freedom', settings: {} }, { tag: 'block', protocol: 'blackhole', settings: {} }, ...outbounds], routing: { domainStrategy: 'AsIs', rules: [ { type: 'field', ip: ['geoip:private'], outboundTag: 'direct' }, { type: 'field', domain: ['geosite:cn'], outboundTag: 'direct' }, { type: 'field', ip: ['geoip:cn'], outboundTag: 'direct' }, { type: 'field', port: '0-65535', outboundTag: proxyTags[0] || 'direct' } ] } }, null, 2);
}