import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as pi from '../controllers/purchaseInvoiceController.js';
import * as st from '../controllers/stockTransferController.js';
import * as si from '../controllers/salesInvoiceController.js';
import * as sr from '../controllers/salesReturnController.js';
import * as rv from '../controllers/receiptVoucherController.js';
import * as pv from '../controllers/paymentVoucherController.js';
import * as bv from '../controllers/bankVoucherController.js';
import * as jv from '../controllers/journalVoucherController.js';

const router = Router();
router.use(authenticate);

router.route('/purchase-invoices').get(pi.list).post(pi.create);
router.route('/purchase-invoices/:id').get(pi.getOne).put(pi.update).delete(pi.remove);

router.route('/stock-transfers').get(st.list).post(st.create);
router.route('/stock-transfers/:id').get(st.getOne).put(st.update).delete(st.remove);

router.route('/sales-invoices').get(si.list).post(si.create);
router.route('/sales-invoices/:id').get(si.getOne).put(si.update).delete(si.remove);

router.route('/sales-returns').get(sr.list).post(sr.create);
router.route('/sales-returns/:id').get(sr.getOne).put(sr.update).delete(sr.remove);

router.route('/receipt-vouchers').get(rv.list).post(rv.create);
router.route('/receipt-vouchers/:id').get(rv.getOne).put(rv.update).delete(rv.remove);

router.route('/payment-vouchers').get(pv.list).post(pv.create);
router.route('/payment-vouchers/:id').get(pv.getOne).put(pv.update).delete(pv.remove);

router.route('/bank-vouchers').get(bv.list).post(bv.create);
router.route('/bank-vouchers/:id').get(bv.getOne).put(bv.update).delete(bv.remove);

router.route('/journal-vouchers').get(jv.list).post(jv.create);
router.route('/journal-vouchers/:id').get(jv.getOne).put(jv.update).delete(jv.remove);

export default router;
