import mongoose from 'mongoose';

/** customer | supplier | expense | bank | cash — extensible enum */
const HEAD_TYPES = ['customer', 'supplier', 'expense', 'bank', 'cash', 'other'];

const accountHeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: HEAD_TYPES, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    openingBalance: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

accountHeadSchema.index({ name: 1, type: 1 });

export const AccountHead = mongoose.model('AccountHead', accountHeadSchema);
export const ACCOUNT_HEAD_TYPES = HEAD_TYPES;
