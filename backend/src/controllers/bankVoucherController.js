import { BankVoucher } from '../models/BankVoucher.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextDocumentNumber } from '../utils/documentNumber.js';
import { assertJournalBalanced } from '../utils/voucherMath.js';

export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.from) q.date = { ...q.date, $gte: new Date(req.query.from) };
  if (req.query.to) q.date = { ...q.date, $lte: new Date(req.query.to) };
  const rows = await BankVoucher.find(q).sort({ date: -1 }).populate('bankAccount').populate('lines.account');
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await BankVoucher.findById(req.params.id).populate('bankAccount').populate('lines.account');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  assertJournalBalanced(req.body.lines || []);
  const documentNumber = await nextDocumentNumber('BV', 'BV');
  const row = await BankVoucher.create({
    ...req.body,
    documentNumber,
    createdBy: req.user?._id,
  });
  const populated = await BankVoucher.findById(row._id).populate('bankAccount').populate('lines.account');
  res.status(201).json({ success: true, data: populated });
});

export const update = asyncHandler(async (req, res) => {
  assertJournalBalanced(req.body.lines || []);
  const existing = await BankVoucher.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const row = await BankVoucher.findByIdAndUpdate(
    req.params.id,
    { ...req.body, documentNumber: existing.documentNumber },
    { new: true, runValidators: true }
  )
    .populate('bankAccount')
    .populate('lines.account');
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  const row = await BankVoucher.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});
