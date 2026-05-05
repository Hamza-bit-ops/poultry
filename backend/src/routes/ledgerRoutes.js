import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as led from '../controllers/ledgerController.js';

const router = Router();
router.use(authenticate);

router.get('/customers/:id', led.customerLedger);
router.get('/suppliers/:id', led.supplierLedger);
router.get('/cash/:id', led.cashLedger);
router.get('/bank/:id', led.bankLedger);

export default router;
