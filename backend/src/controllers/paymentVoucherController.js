import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextDocumentNumber } from '../utils/documentNumber.js';

export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.from) q.date = { ...q.date, $gte: new Date(req.query.from) };
  if (req.query.to) q.date = { ...q.date, $lte: new Date(req.query.to) };
  const rows = await PaymentVoucher.find(q).sort({ date: -1 }).populate('paidTo paidFrom');
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await PaymentVoucher.findById(req.params.id).populate('paidTo paidFrom');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  const documentNumber = await nextDocumentNumber('PV', 'PV');
  const row = await PaymentVoucher.create({
    ...req.body,
    documentNumber,
    createdBy: req.user?._id,
  });
  const populated = await PaymentVoucher.findById(row._id).populate('paidTo paidFrom');
  res.status(201).json({ success: true, data: populated });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await PaymentVoucher.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const row = await PaymentVoucher.findByIdAndUpdate(
    req.params.id,
    { ...req.body, documentNumber: existing.documentNumber },
    { new: true, runValidators: true }
  ).populate('paidTo paidFrom');
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  const row = await PaymentVoucher.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});
