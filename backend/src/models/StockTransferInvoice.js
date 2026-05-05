import mongoose from 'mongoose';

const transferLineSchema = new mongoose.Schema({
  lineType: { type: String, enum: ['poultry', 'feed', 'medicine'], required: true },
  description: { type: String, trim: true, default: '' },
  quantity: { type: Number, required: true, min: 0 },
  poultryType: { type: mongoose.Schema.Types.ObjectId, ref: 'PoultryType' },
  productName: { type: String, trim: true, default: '' },
});

const stockTransferInvoiceSchema = new mongoose.Schema(
  {
    documentNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    fromFarm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    toFarm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    lines: { type: [transferLineSchema], validate: [(v) => v?.length > 0, 'At least one line required'] },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockTransferInvoiceSchema.index({ date: -1 });

export const StockTransferInvoice = mongoose.model('StockTransferInvoice', stockTransferInvoiceSchema);
