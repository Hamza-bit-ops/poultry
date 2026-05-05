import mongoose from 'mongoose';

const bankLineSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
  narration: { type: String, default: '' },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
});

const bankVoucherSchema = new mongoose.Schema(
  {
    documentNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    bankAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
    lines: { type: [bankLineSchema], validate: [(v) => v?.length > 0, 'At least one line required'] },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bankVoucherSchema.index({ date: -1 });

export const BankVoucher = mongoose.model('BankVoucher', bankVoucherSchema);
