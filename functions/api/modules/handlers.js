import { KV_KEY_NODES, KV_KEY_PROFILES, SUBVERTER_URL } from './constants.js';
import { resolveNodesForProfile } from './parsers.js';
import { buildClashConfig, buildV2rayConfig } from './builders.js';

/**
 * 通用的CRUD处理器
 * @param {string} kvKey - 要操作的KV键名
 * @param {EventContext} context - Cloudflare Functions的上下文对象
 * @returns {Promise<Response>}
 */
async function handleCrud(kvKey, context) {
    const { request, env } = context;
    const id = context.params.path[1]; // 对于 /api/nodes/123, id 是 "123"
    
    let items = await env.KV.get(kvKey, 'json') || [];

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

        case 'PUT': {
            if (!id) return new Response('ID is required for update', { status: 400 });
            const updatedItem = await request.json();
            const itemIndex = items.findIndex(item => item.id === id);
            if (itemIndex === -1) {
                return new Response('Item not found', { status: 404 });
            }
            items[itemIndex] = { ...updatedItem, id: id };
            await env.KV.put(kvKey, JSON.stringify(items));
            return new Response(JSON.stringify(items[itemIndex]));
        }

        case 'DELETE': {
            if (!id) return new Response('ID required', { status: 400 });
            const remainingItems = items.filter(item => item.id !== id);
            await env.KV.put(kvKey, JSON.stringify(remainingItems));
            return new Response(null, { status: 204 });
        }

        default:
            return new Response('Method Not Allowed', { status: 405 });
    }
}

// 导出具体的处理器
export const handleNodesRequest = (context) => handleCrud(KV_KEY_NODES, context);
export const handleProfilesRequest = (context) => handleCrud(KV_KEY_PROFILES, context);

// 订阅生成处理器
export async function handleSubscribeRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = context.params.path[1];

    try {
        const profilesStr = await env.KV.get(KV_KEY_PROFILES);
        const allProfiles = profilesStr ? JSON.parse(profilesStr) : [];
        const targetProfile = allProfiles.find(p => p.id === id);

        if (!targetProfile) {
            return new Response('Profile not found', { status: 404 });
        }

        const format = targetProfile.outputFormat.toLowerCase();
        const resolvedNodes = await resolveNodesForProfile(targetProfile, env);

        if (resolvedNodes.length === 0) {
            return new Response(`// No nodes found for this profile.`, {
                status: 200,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }

        let outputConfig = '';
        let contentType = 'text/plain; charset=utf-8';
        let fileExtension = 'txt';

        if (format === 'clash') {
            outputConfig = buildClashConfig(resolvedNodes, targetProfile);
            fileExtension = 'yaml';
        } else if (format === 'v2ray') {
            outputConfig = buildV2rayConfig(resolvedNodes);
            contentType = 'application/json; charset=utf-8';
            fileExtension = 'json';
        } else if (format === 'v2rayn') {
            const nodeListString = resolvedNodes.map(n => n.url).join('\n');
            outputConfig = btoa(nodeListString);
        } else {
            // 对于其他所有格式，调用外部subconverter
            const nodeListString = resolvedNodes.map(n => n.url).join('\n');
            const base64Nodes = btoa(nodeListString);
            const callbackUrl = `data:text/plain;base64,${base64Nodes}`;
            
            const subconverterUrl = new URL(`https://${SUBVERTER_URL}/sub`);
            subconverterUrl.searchParams.set('target', format);
            subconverterUrl.searchParams.set('url', callbackUrl);
            subconverterUrl.searchParams.set('filename', targetProfile.name);

            console.log(`Forwarding to subconverter: ${subconverterUrl.toString()}`);
            // 直接代理请求，将客户端的请求头也转发过去
            return fetch(subconverterUrl.toString(), { headers: request.headers });
        }

        return new Response(outputConfig, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(targetProfile.name)}.${fileExtension}"`,
            },
        });

    } catch (error) {
        console.error('Subscription generation failed:', error);
        return new Response(`Backend Error: ${error.stack}`, { status: 500 });
    }
}