import mongoose from 'mongoose';

/**
 * Atomic counters for voucher/invoice numbers per prefix (e.g. PI-2026-0001).
 */
const sequenceSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  lastNumber: { type: Number, default: 0 },
});

export const DocumentSequence = mongoose.model('DocumentSequence', sequenceSchema);
