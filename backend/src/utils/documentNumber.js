import { DocumentSequence } from '../models/DocumentSequence.js';

/**
 * Generates next document number: PREFIX-YEAR-NNNN (padded to 4 digits).
 */
export async function nextDocumentNumber(key, prefix) {
  const year = new Date().getFullYear();
  const seqKey = `${key}_${year}`;
  const doc = await DocumentSequence.findOneAndUpdate(
    { key: seqKey },
    { $inc: { lastNumber: 1 }, $setOnInsert: { key: seqKey } },
    { new: true, upsert: true }
  );
  const num = String(doc.lastNumber).padStart(4, '0');
  return `${prefix}-${year}-${num}`;
}
