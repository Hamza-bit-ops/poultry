import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Farm = mongoose.model('Farm', farmSchema);
