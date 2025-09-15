import { Request, Response } from 'express';
import { verifyRequestAndGetUserExpress } from '../helper/auth.js';
import { listLayers, createLayer, getLayer, updateLayer, deleteLayer } from '../services/layers.service.js';

export async function list(req: Request, res: Response) {
  const who = await verifyRequestAndGetUserExpress(req);
  const userId = (who as any).ok ? (((who as any).user._id || (who as any).user.email)) : (process.env.SEED_USER_ID || 'demo-user');
  const q = (req.query.q as string) || '';
  const type = (req.query.type as string) || undefined;
  const items = await listLayers(userId!, q, type);
  res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
  return res.json({ items });
}

export async function create(req: Request, res: Response) {
  const who = await verifyRequestAndGetUserExpress(req);
  const userId = (who as any).ok ? (((who as any).user._id || (who as any).user.email)) : (process.env.SEED_USER_ID || 'demo-user');
  const body = req.body || {};
  const item = await createLayer(userId!, body);
  return res.json({ item });
}

export async function get(req: Request, res: Response) {
  const item = await getLayer(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json({ item });
}

export async function patch(req: Request, res: Response) {
  const item = await updateLayer(req.params.id, req.body || {});
  return res.json({ item });
}

export async function remove(req: Request, res: Response) {
  await deleteLayer(req.params.id);
  return res.json({ ok: true });
}

