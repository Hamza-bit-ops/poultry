import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getHomeSummary } from '../controllers/homeController.js';

const router = Router();
router.use(authenticate);
router.get('/summary', getHomeSummary);

export default router;
