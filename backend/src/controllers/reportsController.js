import { asyncHandler } from '../middleware/asyncHandler.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { SalesInvoice } from '../models/SalesInvoice.js';

/** Purchase summary with optional date filter */
export const purchaseSummary = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }
  const agg = await PurchaseInvoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
      },
    },
  ]);
  res.json({
    success: true,
    data: {
      invoiceCount: agg[0]?.count || 0,
      totalPurchases: agg[0]?.totalAmount || 0,
    },
  });
});

/** Supplier-wise totals */
export const purchaseBySupplier = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }
  const rows = await PurchaseInvoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$supplier',
        total: { $sum: '$total' },
        invoices: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'accountheads',
        localField: '_id',
        foreignField: '_id',
        as: 'supplier',
      },
    },
    { $unwind: '$supplier' },
    { $sort: { total: -1 } },
    {
      $project: {
        supplierId: '$_id',
        supplierName: '$supplier.name',
        total: 1,
        invoices: 1,
      },
    },
  ]);
  res.json({ success: true, data: rows });
});

export const salesSummary = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }
  const agg = await SalesInvoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalSales: { $sum: '$total' },
      },
    },
  ]);
  const profitAgg = await SalesInvoice.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$lines.amount' },
        cost: { $sum: { $multiply: ['$lines.quantity', { $ifNull: ['$lines.unitCost', 0] }] } },
      },
    },
  ]);
  res.json({
    success: true,
    data: {
      invoiceCount: agg[0]?.count || 0,
      totalSales: agg[0]?.totalSales || 0,
      lineRevenue: profitAgg[0]?.revenue || 0,
      lineCost: profitAgg[0]?.cost || 0,
      grossProfit: (profitAgg[0]?.revenue || 0) - (profitAgg[0]?.cost || 0),
    },
  });
});

export const salesByCustomer = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }
  const rows = await SalesInvoice.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$customer',
        totalSales: { $sum: '$lines.amount' },
        totalCost: { $sum: { $multiply: ['$lines.quantity', { $ifNull: ['$lines.unitCost', 0] }] } },
        invoices: { $addToSet: '$_id' },
      },
    },
    {
      $lookup: {
        from: 'accountheads',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerId: '$_id',
        customerName: '$customer.name',
        totalSales: 1,
        grossProfit: { $subtract: ['$totalSales', '$totalCost'] },
        invoiceCount: { $size: '$invoices' },
      },
    },
    { $sort: { totalSales: -1 } },
  ]);
  res.json({ success: true, data: rows });
});
