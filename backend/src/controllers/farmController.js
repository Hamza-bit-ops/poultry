import { Farm } from '../models/Farm.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const listFarms = asyncHandler(async (req, res) => {
  const farms = await Farm.find().sort({ name: 1 });
  res.json({ success: true, data: farms });
});

export const getFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findById(req.params.id);
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  res.json({ success: true, data: farm });
});

export const createFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.create(req.body);
  res.status(201).json({ success: true, data: farm });
});

export const updateFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  res.json({ success: true, data: farm });
});

export const deleteFarm = asyncHandler(async (req, res) => {
  const farm = await Farm.findByIdAndDelete(req.params.id);
  if (!farm) return res.status(404).json({ success: false, message: 'Farm not found' });
  res.json({ success: true, message: 'Deleted' });
});
