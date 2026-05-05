import { asyncHandler } from '../middleware/asyncHandler.js';
import { PoultryStock } from '../models/PoultryStock.js';
import { FeedStock } from '../models/FeedStock.js';
import { MedicineStock } from '../models/MedicineStock.js';
import { StockMovement } from '../models/StockMovement.js';

export const poultryStock = asyncHandler(async (req, res) => {
  const rows = await PoultryStock.find().populate('farm').populate('poultryType').sort({ 'farm.name': 1 });
  res.json({ success: true, data: rows });
});

export const feedStock = asyncHandler(async (req, res) => {
  const rows = await FeedStock.find().populate('unit').sort({ name: 1 });
  res.json({ success: true, data: rows });
});

export const medicineStock = asyncHandler(async (req, res) => {
  const rows = await MedicineStock.find().populate('unit').sort({ name: 1 });
  res.json({ success: true, data: rows });
});

export const movements = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.category) q.category = req.query.category;
  if (req.query.from) q.date = { ...q.date, $gte: new Date(req.query.from) };
  if (req.query.to) q.date = { ...q.date, $lte: new Date(req.query.to) };
  const rows = await StockMovement.find(q)
    .sort({ date: -1 })
    .limit(Number(req.query.limit) || 500)
    .populate('farm poultryType unit');
  res.json({ success: true, data: rows });
});
