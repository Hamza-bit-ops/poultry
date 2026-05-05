import { asyncHandler } from '../middleware/asyncHandler.js';
import { PoultryStock } from '../models/PoultryStock.js';
import { FeedStock } from '../models/FeedStock.js';
import { MedicineStock } from '../models/MedicineStock.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { AccountHead } from '../models/AccountHead.js';

/**
 * Home summary: aggregate stock, approximate cash/bank balance, recent vouchers.
 */
export const getHomeSummary = asyncHandler(async (req, res) => {
  const poultryAgg = await PoultryStock.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]);
  const feedAgg = await FeedStock.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]);
  const medAgg = await MedicineStock.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]);

  const cashHeads = await AccountHead.find({ type: 'cash' }).select('_id');
  const bankHeads = await AccountHead.find({ type: 'bank' }).select('_id');
  const cashIds = cashHeads.map((h) => h._id);
  const bankIds = bankHeads.map((h) => h._id);

  const receiptIn = await ReceiptVoucher.aggregate([
    { $match: { depositTo: { $in: [...cashIds, ...bankIds] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const paymentOut = await PaymentVoucher.aggregate([
    { $match: { paidFrom: { $in: [...cashIds, ...bankIds] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const cashIn = receiptIn[0]?.total || 0;
  const cashOut = paymentOut[0]?.total || 0;
  const liquidBalance = cashIn - cashOut;
  const purchaseTotals = await PurchaseInvoice.aggregate([
    {
      $group: {
        _id: null,
        invoiceCount: { $sum: 1 },
        totalAmount: { $sum: '$total' },
      },
    },
  ]);
  const salesTotals = await SalesInvoice.aggregate([
    {
      $group: {
        _id: null,
        invoiceCount: { $sum: 1 },
        totalAmount: { $sum: '$total' },
      },
    },
  ]);
  const salesMargin = await SalesInvoice.aggregate([
    { $unwind: '$lines' },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$lines.amount' },
        cost: { $sum: { $multiply: ['$lines.quantity', { $ifNull: ['$lines.unitCost', 0] }] } },
      },
    },
  ]);
  const totalPurchases = purchaseTotals[0]?.totalAmount || 0;
  const totalSales = salesTotals[0]?.totalAmount || 0;
  const grossProfit = (salesMargin[0]?.revenue || 0) - (salesMargin[0]?.cost || 0);
  const netFlow = totalSales - totalPurchases;

  const recentPurchases = await PurchaseInvoice.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('supplier', 'name type')
    .select('documentNumber date total supplier');
  const recentSales = await SalesInvoice.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('customer', 'name type')
    .select('documentNumber date total customer');

  res.json({
    success: true,
    data: {
      stockSummary: {
        poultryBirds: poultryAgg[0]?.total || 0,
        feedUnits: feedAgg[0]?.total || 0,
        medicineUnits: medAgg[0]?.total || 0,
      },
      /** Net receipts minus payments through cash/bank accounts (simplified). */
      approximateLiquidBalance: liquidBalance,
      invoiceSummary: {
        purchaseInvoiceCount: purchaseTotals[0]?.invoiceCount || 0,
        salesInvoiceCount: salesTotals[0]?.invoiceCount || 0,
        totalPurchases,
        totalSales,
        netFlow,
        grossProfit,
        grossLoss: grossProfit < 0 ? Math.abs(grossProfit) : 0,
      },
      recentTransactions: [
        ...recentPurchases.map((p) => ({
          kind: 'purchase',
          id: p._id,
          documentNumber: p.documentNumber,
          date: p.date,
          amount: p.total,
          party: p.supplier?.name,
        })),
        ...recentSales.map((s) => ({
          kind: 'sale',
          id: s._id,
          documentNumber: s.documentNumber,
          date: s.date,
          amount: s.total,
          party: s.customer?.name,
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8),
    },
  });
});
