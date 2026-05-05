import mongoose from 'mongoose';

const journalLineSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountHead', required: true },
  narration: { type: String, default: '' },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 },
});

const journalVoucherSchema = new mongoose.Schema(
  {
    documentNumber: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    lines: { type: [journalLineSchema], validate: [(v) => v?.length > 0, 'At least one line required'] },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

journalVoucherSchema.index({ date: -1 });

export const JournalVoucher = mongoose.model('JournalVoucher', journalVoucherSchema);
