import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as fin from '../controllers/financialController.js';

const router = Router();
router.use(authenticate);

router.get('/profit-loss', fin.profitAndLoss);
router.get('/balance-sheet', fin.balanceSheet);
router.get('/cash-flow', fin.cashFlow);

export default router;
