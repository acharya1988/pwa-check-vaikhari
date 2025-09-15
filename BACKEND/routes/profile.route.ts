import { Router } from 'express';
import * as ctrl from '../controller/profile.controller.js';

const router = Router();

router.get('/me', async (req, res) => ctrl.me(req, res));

export default router;
