// functions/api/[[path]].js

import { authMiddleware, handleLoginRequest, handleLogoutRequest } from './modules/auth.js';
import { handleNodesRequest, handleProfilesRequest, handleSubscribeRequest } from './modules/handlers.js';

export async function onRequest(context) {
    const { request } = context;
    const resource = context.params.path[0];

    // 1. 公共路由，无需认证
    if (resource === 'subscribe') {
        return handleSubscribeRequest(context);
    }
    if (resource === 'login' && request.method === 'POST') {
        return handleLoginRequest(context);
    }

    // 2. 认证检查
    const isAuthed = await authMiddleware(request, context.env);
    if (!isAuthed) {
        return new Response('Unauthorized', { status: 401 });
    }

    // 3. 受保护的路由
    switch (resource) {
        case 'nodes':
            return handleNodesRequest(context);
        case 'profiles':
            return handleProfilesRequest(context);
        case 'logout':
            return handleLogoutRequest(context);
        default:
            return new Response('API Route Not Found', { status: 404 });
    }
}