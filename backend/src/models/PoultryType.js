import mongoose from 'mongoose';

const poultryTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

poultryTypeSchema.index({ name: 1 }, { unique: true });

export const PoultryType = mongoose.model('PoultryType', poultryTypeSchema);
