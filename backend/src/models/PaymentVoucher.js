import mongoose from 'mongoose';

const paymentVoucherSchema = new mongoose.Schema(
  {
    documentNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    paidTo: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    paidFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ['cash', 'bank', 'cheque', 'upi', 'other'], default: 'bank' },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentVoucherSchema.index({ date: -1 });

export const PaymentVoucher = mongoose.model('PaymentVoucher', paymentVoucherSchema);
