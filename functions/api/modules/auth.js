// functions/api/modules/auth.js

import { COOKIE_NAME, SESSION_DURATION } from './constants.js';

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

export async function authMiddleware(request, env) {
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

export async function handleLoginRequest(context) {
    const { request, env } = context;
    try {
        const { password } = await request.json();
        if (password === env.ADMIN_PASSWORD) {
            const token = await createSignedToken(env.COOKIE_SECRET, String(Date.now()));
            const headers = new Headers();
            headers.append('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION / 1000}`);
            return new Response(JSON.stringify({ success: true }), { headers });
        }
        return new Response(JSON.stringify({ error: '密码错误' }), { status: 401 });
    } catch (e) {
        return new Response(JSON.stringify({ error: '登录请求无效' }), { status: 400 });
    }
}

export async function handleLogoutRequest(context) {
    const headers = new Headers();
    headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return new Response(JSON.stringify({ success: true }), { headers });
}