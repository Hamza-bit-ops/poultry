import { Router } from 'express';
import authRoutes from './authRoutes.js';
import setupRoutes from './setupRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import reportRoutes from './reportRoutes.js';
import ledgerRoutes from './ledgerRoutes.js';
import financialRoutes from './financialRoutes.js';
import homeRoutes from './homeRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/setup', setupRoutes);
router.use('/transactions', transactionRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportRoutes);
router.use('/ledgers', ledgerRoutes);
router.use('/financials', financialRoutes);
router.use('/home', homeRoutes);

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Poultry Farm API is running' });
});

export default router;
