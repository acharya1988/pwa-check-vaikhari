import { Request, Response } from 'express';
import { verifyRequestAndGetUserExpress } from '../helper/auth.js';
import { getOrCreateProfile } from '../services/profile.service.js';

export async function me(req: Request, res: Response) {
  const ver = await verifyRequestAndGetUserExpress(req);
  if (!(ver as any).ok) return res.status((ver as any).status).json({ error: (ver as any).error });
  const { user } = ver as any;
  const profile = await getOrCreateProfile(user);
  return res.json({ profile });
}

