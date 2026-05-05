import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as rep from '../controllers/reportsController.js';

const router = Router();
router.use(authenticate);

router.get('/purchases/summary', rep.purchaseSummary);
router.get('/purchases/by-supplier', rep.purchaseBySupplier);
router.get('/sales/summary', rep.salesSummary);
router.get('/sales/by-customer', rep.salesByCustomer);

export default router;
