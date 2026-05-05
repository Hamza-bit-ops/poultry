import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextDocumentNumber } from '../utils/documentNumber.js';

export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.from) q.date = { ...q.date, $gte: new Date(req.query.from) };
  if (req.query.to) q.date = { ...q.date, $lte: new Date(req.query.to) };
  const rows = await ReceiptVoucher.find(q).sort({ date: -1 }).populate('receivedFrom depositTo');
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await ReceiptVoucher.findById(req.params.id).populate('receivedFrom depositTo');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  const documentNumber = await nextDocumentNumber('RV', 'RV');
  const row = await ReceiptVoucher.create({
    ...req.body,
    documentNumber,
    createdBy: req.user?._id,
  });
  const populated = await ReceiptVoucher.findById(row._id).populate('receivedFrom depositTo');
  res.status(201).json({ success: true, data: populated });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await ReceiptVoucher.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const row = await ReceiptVoucher.findByIdAndUpdate(
    req.params.id,
    { ...req.body, documentNumber: existing.documentNumber },
    { new: true, runValidators: true }
  ).populate('receivedFrom depositTo');
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  const row = await ReceiptVoucher.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});
