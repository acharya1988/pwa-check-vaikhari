import { Request, Response } from 'express';
import { verifyRequestAndGetUserExpress } from '../helper/auth.js';
import { listDrifts, createDrift, getDrift, updateDrift, deleteDrift } from '../services/drifts.service.js';

export async function list(req: Request, res: Response) {
  const who = await verifyRequestAndGetUserExpress(req);
  const userId = (who as any).ok ? (((who as any).user._id || (who as any).user.email)) : (process.env.SEED_USER_ID || 'demo-user');
  const q = (req.query.q as string) || '';
  const status = (req.query.status as string) || undefined;
  const items = await listDrifts(userId!, q, status);
  res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
  return res.json({ items });
}

export async function create(req: Request, res: Response) {
  const who = await verifyRequestAndGetUserExpress(req);
  const userId = (who as any).ok ? (((who as any).user._id || (who as any).user.email)) : (process.env.SEED_USER_ID || 'demo-user');
  const body = req.body || {};
  const doc = await createDrift(userId!, body);
  return res.json({ item: doc });
}

export async function get(req: Request, res: Response) {
  const item = await getDrift(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json({ item });
}

export async function patch(req: Request, res: Response) {
  await verifyRequestAndGetUserExpress(req);
  const item = await updateDrift(req.params.id, req.body || {});
  return res.json({ item });
}

export async function remove(req: Request, res: Response) {
  await verifyRequestAndGetUserExpress(req);
  await deleteDrift(req.params.id);
  return res.json({ ok: true });
}

