import mongoose from 'mongoose';

/** Current on-hand count per farm + poultry type */
const poultryStockSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    poultryType: { type: mongoose.Schema.Types.ObjectId, ref: 'PoultryType', required: true },
    quantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

poultryStockSchema.index({ farm: 1, poultryType: 1 }, { unique: true });

export const PoultryStock = mongoose.model('PoultryStock', poultryStockSchema);
