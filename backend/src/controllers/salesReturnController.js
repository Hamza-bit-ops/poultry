import { SalesReturnInvoice } from '../models/SalesReturnInvoice.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextDocumentNumber } from '../utils/documentNumber.js';
import { normalizeSalesLines, sumLineAmounts } from '../utils/voucherMath.js';
import { applySalesReturnInvoice, reverseSalesReturnInvoice } from '../services/inventoryService.js';

function buildTotals(body) {
  const lines = normalizeSalesLines(body.lines || []);
  const subtotal = sumLineAmounts(lines);
  const total = subtotal + (Number(body.taxAmount) || 0);
  return { lines, subtotal, total };
}

export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.from) q.date = { ...q.date, $gte: new Date(req.query.from) };
  if (req.query.to) q.date = { ...q.date, $lte: new Date(req.query.to) };
  const rows = await SalesReturnInvoice.find(q)
    .sort({ date: -1 })
    .populate('customer')
    .populate('lines.farm')
    .populate('lines.poultryType');
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await SalesReturnInvoice.findById(req.params.id)
    .populate('customer')
    .populate('lines.farm')
    .populate('lines.poultryType');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  const { lines, subtotal, total } = buildTotals(req.body);
  if (!lines.length) return res.status(400).json({ success: false, message: 'Lines required' });
  const documentNumber = await nextDocumentNumber('SR', 'SR');
  const row = await SalesReturnInvoice.create({
    ...req.body,
    documentNumber,
    lines,
    subtotal,
    total,
    createdBy: req.user?._id,
  });
  await applySalesReturnInvoice(row);
  const populated = await SalesReturnInvoice.findById(row._id)
    .populate('customer')
    .populate('lines.farm')
    .populate('lines.poultryType');
  res.status(201).json({ success: true, data: populated });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await SalesReturnInvoice.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  await reverseSalesReturnInvoice(existing);
  const { lines, subtotal, total } = buildTotals(req.body);
  const row = await SalesReturnInvoice.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lines,
      subtotal,
      total,
      documentNumber: existing.documentNumber,
    },
    { new: true, runValidators: true }
  );
  await applySalesReturnInvoice(row);
  const populated = await SalesReturnInvoice.findById(row._id)
    .populate('customer')
    .populate('lines.farm')
    .populate('lines.poultryType');
  res.json({ success: true, data: populated });
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await SalesReturnInvoice.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  await reverseSalesReturnInvoice(existing);
  await SalesReturnInvoice.deleteOne({ _id: existing._id });
  res.json({ success: true, message: 'Deleted' });
});
