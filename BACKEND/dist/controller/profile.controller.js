import { verifyRequestAndGetUserExpress } from '../helper/auth.js';
import { getOrCreateProfile } from '../services/profile.service.js';
export async function me(req, res) {
    const ver = await verifyRequestAndGetUserExpress(req);
    if (!ver.ok)
        return res.status(ver.status).json({ error: ver.error });
    const { user } = ver;
    const profile = await getOrCreateProfile(user);
    return res.json({ profile });
}
