import mongoose from 'mongoose';

const MOVEMENT_TYPES = [
  'purchase',
  'sale',
  'transfer_in',
  'transfer_out',
  'adjustment',
  'return_in',
  'return_out',
];

const stockMovementSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ['poultry', 'feed', 'medicine'], required: true },
    movementType: { type: String, enum: MOVEMENT_TYPES, required: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
    poultryType: { type: mongoose.Schema.Types.ObjectId, ref: 'PoultryType' },
    itemName: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    referenceModel: { type: String, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    documentNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ date: -1, category: 1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
export const STOCK_MOVEMENT_TYPES = MOVEMENT_TYPES;
