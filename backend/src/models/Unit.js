import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    abbreviation: { type: String, required: true, trim: true, uppercase: true },
  },
  { timestamps: true }
);

unitSchema.index({ abbreviation: 1 }, { unique: true });

export const Unit = mongoose.model('Unit', unitSchema);
