import mongoose from 'mongoose';

const medicineStockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    quantity: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0 },
  },
  { timestamps: true }
);

medicineStockSchema.index({ name: 1 }, { unique: true });

export const MedicineStock = mongoose.model('MedicineStock', medicineStockSchema);
