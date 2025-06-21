// functions/api/[[path]].js

const KV_KEY_NODES = 'prosub_nodes_v1';

/**
 * 主请求处理函数
 * @param {EventContext} context
 */
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 我们将 API 设计为 /api/nodes/:id 的形式
    // pathParts[0] 会是 'nodes'
    // pathParts[1] 会是 id (如果存在)
    const pathParts = context.params.path;
    const resource = pathParts[0];
    const id = pathParts[1];

    // 只处理 /api/nodes 的请求
    if (resource !== 'nodes') {
        return new Response('Not Found', { status: 404 });
    }

    try {
        switch (request.method) {
            case 'GET':
                // 获取所有节点
                const dataStr = await env.KV.get(KV_KEY_NODES);
                const nodes = dataStr ? JSON.parse(dataStr) : [];
                return new Response(JSON.stringify(nodes), {
                    headers: { 'Content-Type': 'application/json' },
                });

            case 'POST':
                // 添加一个新节点
                const newNode = await request.json();
                if (!newNode.name || !newNode.url) { // 简单验证
                    return new Response('Node name and url are required', { status: 400 });
                }
                newNode.id = crypto.randomUUID(); // 生成一个唯一的ID
                newNode.createdAt = new Date().toISOString();

                const currentNodesStr = await env.KV.get(KV_KEY_NODES);
                const currentNodes = currentNodesStr ? JSON.parse(currentNodesStr) : [];
                currentNodes.push(newNode);

                await env.KV.put(KV_KEY_NODES, JSON.stringify(currentNodes));
                return new Response(JSON.stringify(newNode), { status: 201 });

            case 'DELETE':
                // 删除一个节点
                if (!id) {
                    return new Response('Node ID is required', { status: 400 });
                }
                const nodesBeforeDeleteStr = await env.KV.get(KV_KEY_NODES);
                let nodesBeforeDelete = nodesBeforeDeleteStr ? JSON.parse(nodesBeforeDeleteStr) : [];

                const nodesAfterDelete = nodesBeforeDelete.filter(node => node.id !== id);

                await env.KV.put(KV_KEY_NODES, JSON.stringify(nodesAfterDelete));
                return new Response(null, { status: 204 }); // 204 No Content

            default:
                return new Response('Method Not Allowed', { status: 405 });
        }
    } catch (error) {
        console.error(error);
        return new Response('Internal Server Error', { status: 500 });
    }
}