import mongoose from 'mongoose';

const returnLineSchema = new mongoose.Schema({
  lineType: { type: String, enum: ['poultry', 'feed', 'medicine', 'other'], default: 'other' },
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
  poultryType: { type: mongoose.Schema.Types.ObjectId, ref: 'PoultryType' },
  productName: { type: String, trim: true, default: '' },
});

const salesReturnInvoiceSchema = new mongoose.Schema(
  {
    documentNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    originalSalesInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesInvoice', default: null },
    lines: { type: [returnLineSchema], validate: [(v) => v?.length > 0, 'At least one line required'] },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

salesReturnInvoiceSchema.index({ date: -1 });

export const SalesReturnInvoice = mongoose.model('SalesReturnInvoice', salesReturnInvoiceSchema);
