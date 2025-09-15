import { verifyRequestAndGetUserExpress } from '../helper/auth.js';
import { listDrifts, createDrift, getDrift, updateDrift, deleteDrift } from '../services/drifts.service.js';
export async function list(req, res) {
    const who = await verifyRequestAndGetUserExpress(req);
    const userId = who.ok ? ((who.user._id || who.user.email)) : (process.env.SEED_USER_ID || 'demo-user');
    const q = req.query.q || '';
    const status = req.query.status || undefined;
    const items = await listDrifts(userId, q, status);
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return res.json({ items });
}
export async function create(req, res) {
    const who = await verifyRequestAndGetUserExpress(req);
    const userId = who.ok ? ((who.user._id || who.user.email)) : (process.env.SEED_USER_ID || 'demo-user');
    const body = req.body || {};
    const doc = await createDrift(userId, body);
    return res.json({ item: doc });
}
export async function get(req, res) {
    const item = await getDrift(req.params.id);
    if (!item)
        return res.status(404).json({ error: 'Not found' });
    return res.json({ item });
}
export async function patch(req, res) {
    await verifyRequestAndGetUserExpress(req);
    const item = await updateDrift(req.params.id, req.body || {});
    return res.json({ item });
}
export async function remove(req, res) {
    await verifyRequestAndGetUserExpress(req);
    await deleteDrift(req.params.id);
    return res.json({ ok: true });
}
