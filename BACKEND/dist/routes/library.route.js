import { Router } from 'express';
import { mongo } from '../config/db.js';
import * as ctrl from '../controller/library.controller.js';
const router = Router();
router.get('/', async (req, res) => { await mongo(); return ctrl.list(req, res); });
router.post('/collect', async (req, res) => { await mongo(); return ctrl.collect(req, res); });
router.get('/items/:refId', async (req, res) => { await mongo(); return ctrl.getItem(req, res); });
export default router;
