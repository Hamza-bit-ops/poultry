import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as inv from '../controllers/inventoryController.js';

const router = Router();
router.use(authenticate);

router.get('/poultry', inv.poultryStock);
router.get('/feed', inv.feedStock);
router.get('/medicine', inv.medicineStock);
router.get('/movements', inv.movements);

export default router;
