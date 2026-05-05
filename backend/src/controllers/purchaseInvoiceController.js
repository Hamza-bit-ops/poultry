import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextDocumentNumber } from '../utils/documentNumber.js';
import { normalizePurchaseLines, sumLineAmounts } from '../utils/voucherMath.js';
import { applyPurchaseInvoice, reversePurchaseInvoice } from '../services/inventoryService.js';

function buildTotals(body) {
  const lines = normalizePurchaseLines(body.lines || []);
  const subtotal = sumLineAmounts(lines);
  const taxAmount = Number(body.taxAmount) || 0;
  const total = subtotal + taxAmount;
  return { lines, subtotal, taxAmount, total };
}

export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.from) q.date = { ...q.date, $gte: new Date(req.query.from) };
  if (req.query.to) q.date = { ...q.date, $lte: new Date(req.query.to) };
  if (req.query.supplier) q.supplier = req.query.supplier;
  const rows = await PurchaseInvoice.find(q)
    .sort({ date: -1 })
    .populate('supplier')
    .populate('lines.farm')
    .populate('lines.poultryType');
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await PurchaseInvoice.findById(req.params.id)
    .populate('supplier')
    .populate('lines.farm')
    .populate('lines.poultryType')
    .populate('lines.unit');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  const { lines, subtotal, taxAmount, total } = buildTotals(req.body);
  if (!lines.length) return res.status(400).json({ success: false, message: 'Lines required' });
  const documentNumber = await nextDocumentNumber('PI', 'PI');
  const row = await PurchaseInvoice.create({
    ...req.body,
    documentNumber,
    lines,
    subtotal,
    taxAmount,
    total,
    createdBy: req.user?._id,
  });
  await applyPurchaseInvoice(row);
  const populated = await PurchaseInvoice.findById(row._id)
    .populate('supplier')
    .populate('lines.farm')
    .populate('lines.poultryType');
  res.status(201).json({ success: true, data: populated });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await PurchaseInvoice.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  await reversePurchaseInvoice(existing);
  const { lines, subtotal, taxAmount, total } = buildTotals(req.body);
  const row = await PurchaseInvoice.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lines,
      subtotal,
      taxAmount,
      total,
      documentNumber: existing.documentNumber,
    },
    { new: true, runValidators: true }
  );
  await applyPurchaseInvoice(row);
  const populated = await PurchaseInvoice.findById(row._id)
    .populate('supplier')
    .populate('lines.farm')
    .populate('lines.poultryType');
  res.json({ success: true, data: populated });
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await PurchaseInvoice.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  await reversePurchaseInvoice(existing);
  await PurchaseInvoice.deleteOne({ _id: existing._id });
  res.json({ success: true, message: 'Deleted' });
});
