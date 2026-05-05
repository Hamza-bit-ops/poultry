import mongoose from 'mongoose';

const receiptVoucherSchema = new mongoose.Schema(
  {
    documentNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    /** Party paying (usually customer) */
    receivedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    /** Cash or bank account receiving funds */
    depositTo: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ['cash', 'bank', 'cheque', 'upi', 'other'], default: 'cash' },
    reference: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

receiptVoucherSchema.index({ date: -1 });

export const ReceiptVoucher = mongoose.model('ReceiptVoucher', receiptVoucherSchema);
