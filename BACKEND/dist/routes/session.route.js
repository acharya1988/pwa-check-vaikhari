import { Router } from 'express';
import * as ctrl from '../controller/session.controller.js';
const router = Router();
router.post('/', ctrl.create);
router.delete('/', ctrl.remove);
export default router;
