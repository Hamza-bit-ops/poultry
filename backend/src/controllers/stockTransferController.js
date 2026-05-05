import { StockTransferInvoice } from '../models/StockTransferInvoice.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextDocumentNumber } from '../utils/documentNumber.js';
import { applyStockTransferInvoice, reverseStockTransferInvoice } from '../services/inventoryService.js';

export const list = asyncHandler(async (req, res) => {
  const q = {};
  if (req.query.from) q.date = { ...q.date, $gte: new Date(req.query.from) };
  if (req.query.to) q.date = { ...q.date, $lte: new Date(req.query.to) };
  const rows = await StockTransferInvoice.find(q)
    .sort({ date: -1 })
    .populate('fromFarm toFarm')
    .populate('lines.poultryType');
  res.json({ success: true, data: rows });
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await StockTransferInvoice.findById(req.params.id)
    .populate('fromFarm toFarm')
    .populate('lines.poultryType');
  if (!row) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  if (String(req.body.fromFarm) === String(req.body.toFarm)) {
    return res.status(400).json({ success: false, message: 'From and to farm must differ' });
  }
  const documentNumber = await nextDocumentNumber('ST', 'ST');
  const row = await StockTransferInvoice.create({
    ...req.body,
    documentNumber,
    createdBy: req.user?._id,
  });
  await applyStockTransferInvoice(row);
  const populated = await StockTransferInvoice.findById(row._id).populate('fromFarm toFarm lines.poultryType');
  res.status(201).json({ success: true, data: populated });
});

export const update = asyncHandler(async (req, res) => {
  const existing = await StockTransferInvoice.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  await reverseStockTransferInvoice(existing);
  const row = await StockTransferInvoice.findByIdAndUpdate(
    req.params.id,
    { ...req.body, documentNumber: existing.documentNumber },
    { new: true, runValidators: true }
  );
  await applyStockTransferInvoice(row);
  const populated = await StockTransferInvoice.findById(row._id).populate('fromFarm toFarm lines.poultryType');
  res.json({ success: true, data: populated });
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await StockTransferInvoice.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  await reverseStockTransferInvoice(existing);
  await StockTransferInvoice.deleteOne({ _id: existing._id });
  res.json({ success: true, message: 'Deleted' });
});
