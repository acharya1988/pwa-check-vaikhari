import { verifyRequestAndGetUserExpress } from '../helper/auth.js';
import { listLibraryItems, upsertCollect, getLibraryItemOrFallback } from '../services/library.service.js';
export async function list(req, res) {
    const who = await verifyRequestAndGetUserExpress(req);
    const userId = who.ok ? ((who.user._id || who.user.email)) : (process.env.SEED_USER_ID || 'demo-user');
    const items = await listLibraryItems(userId);
    res.setHeader('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');
    return res.json({ items });
}
export async function collect(req, res) {
    const who = await verifyRequestAndGetUserExpress(req);
    const userId = who.ok ? ((who.user._id || who.user.email)) : (process.env.SEED_USER_ID || 'demo-user');
    const item = await upsertCollect(userId, req.body || {});
    return res.json({ item });
}
export async function getItem(req, res) {
    const item = await getLibraryItemOrFallback(req.params.refId);
    if (item)
        return res.json({ item });
    return res.status(404).json({ error: 'Not found' });
}
