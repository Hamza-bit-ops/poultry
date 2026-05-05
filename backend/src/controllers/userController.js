import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const rows = await User.find().select('-passwordHash').populate('role').sort({ name: 1 });
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await User.findById(req.params.id).select('-passwordHash').populate('role');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  const { name, email, password, role, isActive } = req.body;
  if (!password) return res.status(400).json({ success: false, message: 'Password required' });
  const passwordHash = await bcrypt.hash(password, 10);
  const row = await User.create({
    name,
    email: email?.toLowerCase(),
    passwordHash,
    role,
    isActive: isActive !== false,
  });
  const populated = await User.findById(row._id).select('-passwordHash').populate('role');
  res.status(201).json({ success: true, data: populated });
});

export const update = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.password) {
    payload.passwordHash = await bcrypt.hash(payload.password, 10);
    delete payload.password;
  }
  delete payload.passwordHash;
  delete payload.password;
  const row = await User.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
    .select('-passwordHash')
    .populate('role');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  const row = await User.findByIdAndDelete(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, message: 'Deleted' });
});
