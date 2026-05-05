import mongoose from 'mongoose';

const salesLineSchema = new mongoose.Schema({
  lineType: { type: String, enum: ['poultry', 'feed', 'medicine', 'other'], default: 'other' },
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  /** Cost basis per unit for profit reporting */
  unitCost: { type: Number, default: 0, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  poultryType: { type: mongoose.Schema.Types.ObjectId, ref: 'PoultryType' },
  productName: { type: String, trim: true, default: '' },
});

const salesInvoiceSchema = new mongoose.Schema(
  {
    documentNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    lines: { type: [salesLineSchema], validate: [(v) => v?.length > 0, 'At least one line required'] },
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salesInvoiceSchema.index({ date: -1 });

export const SalesInvoice = mongoose.model('SalesInvoice', salesInvoiceSchema);
