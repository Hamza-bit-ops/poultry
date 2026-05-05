/**
 * Recalculates monetary totals from standard invoice line shapes.
 */
export function sumLineAmounts(lines) {
  return lines.reduce((acc, line) => acc + (Number(line.amount) || Number(line.quantity) * Number(line.unitPrice) || 0), 0);
}

export function normalizePurchaseLines(lines) {
  return lines.map((l) => ({
    ...l,
    amount: Number(l.quantity) * Number(l.unitPrice),
  }));
}

export function normalizeSalesLines(lines) {
  return lines.map((l) => ({
    ...l,
    amount: Number(l.quantity) * Number(l.unitPrice),
  }));
}

export function assertJournalBalanced(lines) {
  const debit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const credit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  if (Math.abs(debit - credit) > 0.001) {
    const err = new Error('Journal lines must balance (total debit = total credit)');
    err.status = 400;
    throw err;
  }
}
