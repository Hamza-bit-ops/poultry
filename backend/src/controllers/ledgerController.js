import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AccountHead } from '../models/AccountHead.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { SalesReturnInvoice } from '../models/SalesReturnInvoice.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { JournalVoucher } from '../models/JournalVoucher.js';
import { BankVoucher } from '../models/BankVoucher.js';

function runningBalance(entries, opening, normalDebit) {
  let bal = opening;
  const out = entries
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => {
      if (normalDebit) {
        bal += e.debit - e.credit;
      } else {
        bal += e.credit - e.debit;
      }
      return { ...e, balance: bal };
    });
  return out;
}

export const customerLedger = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid id' });
  }
  const head = await AccountHead.findById(id);
  if (!head) return res.status(404).json({ success: false, message: 'Account not found' });

  const entries = [];

  const sales = await SalesInvoice.find({ customer: id }).sort({ date: 1 });
  sales.forEach((s) =>
    entries.push({
      date: s.date,
      type: 'Sales',
      ref: s.documentNumber,
      debit: s.total,
      credit: 0,
      narration: 'Sales invoice',
    })
  );

  const returns = await SalesReturnInvoice.find({ customer: id }).sort({ date: 1 });
  returns.forEach((r) =>
    entries.push({
      date: r.date,
      type: 'Sales Return',
      ref: r.documentNumber,
      debit: 0,
      credit: r.total,
      narration: 'Sales return',
    })
  );

  const receipts = await ReceiptVoucher.find({ receivedFrom: id }).sort({ date: 1 });
  receipts.forEach((r) =>
    entries.push({
      date: r.date,
      type: 'Receipt',
      ref: r.documentNumber,
      debit: 0,
      credit: r.amount,
      narration: `Receipt to ${r.depositTo}`,
    })
  );

  const lines = runningBalance(entries, head.openingBalance || 0, true);
  res.json({ success: true, data: { account: head, lines } });
});

export const supplierLedger = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const head = await AccountHead.findById(id);
  if (!head) return res.status(404).json({ success: false, message: 'Account not found' });

  const entries = [];
  const purchases = await PurchaseInvoice.find({ supplier: id }).sort({ date: 1 });
  purchases.forEach((p) =>
    entries.push({
      date: p.date,
      type: 'Purchase',
      ref: p.documentNumber,
      debit: 0,
      credit: p.total,
      narration: 'Purchase invoice',
    })
  );

  const payments = await PaymentVoucher.find({ paidTo: id }).sort({ date: 1 });
  payments.forEach((p) =>
    entries.push({
      date: p.date,
      type: 'Payment',
      ref: p.documentNumber,
      debit: p.amount,
      credit: 0,
      narration: 'Payment voucher',
    })
  );

  const lines = runningBalance(entries, head.openingBalance || 0, false);
  res.json({ success: true, data: { account: head, lines } });
});

async function buildCashBankLedger(accountId) {
  const head = await AccountHead.findById(accountId);
  if (!head) return null;
  const entries = [];

  const receipts = await ReceiptVoucher.find({ depositTo: accountId }).sort({ date: 1 });
  receipts.forEach((r) =>
    entries.push({
      date: r.date,
      type: 'Receipt',
      ref: r.documentNumber,
      debit: r.amount,
      credit: 0,
      narration: `From ${r.receivedFrom}`,
    })
  );

  const payments = await PaymentVoucher.find({ paidFrom: accountId }).sort({ date: 1 });
  payments.forEach((p) =>
    entries.push({
      date: p.date,
      type: 'Payment',
      ref: p.documentNumber,
      debit: 0,
      credit: p.amount,
      narration: `To ${p.paidTo}`,
    })
  );

  const journals = await JournalVoucher.find({ 'lines.account': accountId }).sort({ date: 1 });
  journals.forEach((j) => {
    j.lines.forEach((ln) => {
      if (String(ln.account) === String(accountId)) {
        entries.push({
          date: j.date,
          type: 'Journal',
          ref: j.documentNumber,
          debit: ln.debit || 0,
          credit: ln.credit || 0,
          narration: ln.narration || j.notes,
        });
      }
    });
  });

  const banks = await BankVoucher.find({ $or: [{ bankAccount: accountId }, { 'lines.account': accountId }] }).sort({
    date: 1,
  });
  banks.forEach((b) => {
    b.lines.forEach((ln) => {
      if (String(ln.account) === String(accountId)) {
        entries.push({
          date: b.date,
          type: 'Bank',
          ref: b.documentNumber,
          debit: ln.debit || 0,
          credit: ln.credit || 0,
          narration: ln.narration || b.notes,
        });
      }
    });
  });

  const lines = runningBalance(entries, head.openingBalance || 0, true);
  return { account: head, lines };
}

export const cashLedger = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await buildCashBankLedger(id);
  if (!data) return res.status(404).json({ success: false, message: 'Account not found' });
  res.json({ success: true, data });
});

export const bankLedger = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = await buildCashBankLedger(id);
  if (!data) return res.status(404).json({ success: false, message: 'Account not found' });
  res.json({ success: true, data });
});
