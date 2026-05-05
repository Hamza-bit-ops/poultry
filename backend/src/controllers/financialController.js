import { asyncHandler } from '../middleware/asyncHandler.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { SalesReturnInvoice } from '../models/SalesReturnInvoice.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { AccountHead } from '../models/AccountHead.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';

/**
 * Basic P&L from sales, returns, COGS from sales lines, purchases and expense payments.
 */
export const profitAndLoss = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }

  const sales = await SalesInvoice.aggregate([{ $match: match }, { $group: { _id: null, t: { $sum: '$total' } } }]);
  const returns = await SalesReturnInvoice.aggregate([
    { $match: match },
    { $group: { _id: null, t: { $sum: '$total' } } },
  ]);
  const cogs = await SalesInvoice.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: null,
        t: { $sum: { $multiply: ['$lines.quantity', { $ifNull: ['$lines.unitCost', 0] }] } },
      },
    },
  ]);
  const purchases = await PurchaseInvoice.aggregate([
    { $match: match },
    { $group: { _id: null, t: { $sum: '$total' } } },
  ]);

  const expenseHeads = await AccountHead.find({ type: 'expense' }).select('_id');
  const expenseIds = expenseHeads.map((e) => e._id);
  const expensePayments = await PaymentVoucher.aggregate([
    {
      $match: {
        ...match,
        paidTo: { $in: expenseIds },
      },
    },
    { $group: { _id: null, t: { $sum: '$amount' } } },
  ]);

  const revenue = (sales[0]?.t || 0) - (returns[0]?.t || 0);
  const costOfGoods = cogs[0]?.t || 0;
  const operatingPurchases = purchases[0]?.t || 0;
  const operatingExpenses = expensePayments[0]?.t || 0;
  const grossProfit = revenue - costOfGoods;
  const netProfit = grossProfit - operatingExpenses;

  res.json({
    success: true,
    data: {
      revenue,
      costOfGoodsSold: costOfGoods,
      grossProfit,
      purchasesRecorded: operatingPurchases,
      expensePayments: operatingExpenses,
      netProfit,
      notes:
        'Purchases are shown separately; tie them to COGS in future versions. Expense payments use Payment Voucher paid to expense-type account heads.',
    },
  });
});

/** Very simplified balance sheet using net receipts/payments as equity proxy */
export const balanceSheet = asyncHandler(async (req, res) => {
  await AccountHead.find({ type: { $in: ['cash', 'bank'] } }).select('name type openingBalance');

  const ar = await SalesInvoice.aggregate([
    { $group: { _id: '$customer', total: { $sum: '$total' } } },
    { $group: { _id: null, sum: { $sum: '$total' } } },
  ]);
  const receipts = await ReceiptVoucher.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);

  const ap = await PurchaseInvoice.aggregate([
    { $group: { _id: '$supplier', total: { $sum: '$total' } } },
    { $group: { _id: null, sum: { $sum: '$total' } } },
  ]);
  const payments = await PaymentVoucher.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);

  const assets = {
    cashAndBankHeads: cashBank.length,
    approximateReceivables: (ar[0]?.sum || 0) - (receipts[0]?.sum || 0),
  };
  const liabilities = {
    approximatePayables: (ap[0]?.sum || 0) - (payments[0]?.sum || 0),
  };
  const equity = {
    retainedEarningsProxy: (assets.approximateReceivables || 0) - (liabilities.approximatePayables || 0),
  };

  res.json({
    success: true,
    data: {
      asOf: new Date(),
      assets,
      liabilities,
      equity,
      disclaimer: 'This is a simplified view for demos; wire full double-entry for production.',
    },
  });
});

export const cashFlow = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }
  const receipts = await ReceiptVoucher.aggregate([
    { $match: match },
    { $group: { _id: null, inflow: { $sum: '$amount' } } },
  ]);
  const payments = await PaymentVoucher.aggregate([
    { $match: match },
    { $group: { _id: null, outflow: { $sum: '$amount' } } },
  ]);
  res.json({
    success: true,
    data: {
      receipts: receipts[0]?.inflow || 0,
      payments: payments[0]?.outflow || 0,
      net: (receipts[0]?.inflow || 0) - (payments[0]?.outflow || 0),
    },
  });
});
