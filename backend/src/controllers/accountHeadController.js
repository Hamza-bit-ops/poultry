import { AccountHead } from '../models/AccountHead.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.type) q.type = req.query.type;
  const rows = await AccountHead.find(q).sort({ name: 1 });
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await AccountHead.findById(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  const row = await AccountHead.create(req.body);
  res.status(201).json({ success: true, data: row });
});

export const update = asyncHandler(async (req, res) => {
  const row = await AccountHead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  const row = await AccountHead.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});
