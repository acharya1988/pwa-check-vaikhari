import { createSession } from '../services/session.service.js';
export async function create(req, res) {
    try {
        const { idToken } = (req.body || {});
        if (!idToken)
            return res.status(400).json({ error: 'Missing idToken' });
        const { session, uid, expiresIn } = await createSession(idToken);
        res.cookie('session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: expiresIn / 1000,
        });
        return res.json({ ok: true, uid });
    }
    catch (e) {
        console.error('[backend/api/session] error', e?.errorInfo || e);
        return res.status(401).json({ error: e?.message || 'session-error' });
    }
}
export async function remove(_req, res) {
    res.cookie('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: new Date(0),
    });
    return res.json({ ok: true });
}
