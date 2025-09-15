import { verifyRequestAndGetUserExpress } from '../helper/auth.js';
import { listLayers, createLayer, getLayer, updateLayer, deleteLayer } from '../services/layers.service.js';
export async function list(req, res) {
    const who = await verifyRequestAndGetUserExpress(req);
    const userId = who.ok ? ((who.user._id || who.user.email)) : (process.env.SEED_USER_ID || 'demo-user');
    const q = req.query.q || '';
    const type = req.query.type || undefined;
    const items = await listLayers(userId, q, type);
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    return res.json({ items });
}
export async function create(req, res) {
    const who = await verifyRequestAndGetUserExpress(req);
    const userId = who.ok ? ((who.user._id || who.user.email)) : (process.env.SEED_USER_ID || 'demo-user');
    const body = req.body || {};
    const item = await createLayer(userId, body);
    return res.json({ item });
}
export async function get(req, res) {
    const item = await getLayer(req.params.id);
    if (!item)
        return res.status(404).json({ error: 'Not found' });
    return res.json({ item });
}
export async function patch(req, res) {
    const item = await updateLayer(req.params.id, req.body || {});
    return res.json({ item });
}
export async function remove(req, res) {
    await deleteLayer(req.params.id);
    return res.json({ ok: true });
}
