import mongoose from 'mongoose';
import { PoultryStock } from '../models/PoultryStock.js';
import { FeedStock } from '../models/FeedStock.js';
import { MedicineStock } from '../models/MedicineStock.js';
import { StockMovement } from '../models/StockMovement.js';

const ref = (modelName, id) => ({ referenceModel: modelName, referenceId: id });

/**
 * Removes stock movements tied to a business document (used before re-apply or delete).
 */
export async function deleteMovementsForRef(modelName, documentId) {
  await StockMovement.deleteMany({
    referenceModel: modelName,
    referenceId: documentId,
  });
}

async function ensurePoultryStock(farmId, poultryTypeId) {
  let doc = await PoultryStock.findOne({ farm: farmId, poultryType: poultryTypeId });
  if (!doc) {
    doc = await PoultryStock.create({ farm: farmId, poultryType: poultryTypeId, quantity: 0 });
  }
  return doc;
}

async function ensureFeedStock(name, unitId) {
  const n = name.trim();
  let doc = await FeedStock.findOne({ name: n });
  if (!doc) {
    doc = await FeedStock.create({ name: n, unit: unitId, quantity: 0 });
  }
  return doc;
}

async function ensureMedicineStock(name, unitId) {
  const n = name.trim();
  let doc = await MedicineStock.findOne({ name: n });
  if (!doc) {
    doc = await MedicineStock.create({ name: n, unit: unitId, quantity: 0 });
  }
  return doc;
}

/** Apply purchase invoice effects to inventory + audit movements */
export async function applyPurchaseInvoice(inv) {
  const modelName = 'PurchaseInvoice';
  const id = inv._id;
  const docNum = inv.documentNumber;
  const d = inv.date;

  for (const line of inv.lines) {
    if (line.lineType === 'poultry' && line.farm && line.poultryType) {
      await ensurePoultryStock(line.farm, line.poultryType);
      await PoultryStock.updateOne(
        { farm: line.farm, poultryType: line.poultryType },
        { $inc: { quantity: line.quantity } }
      );
      await StockMovement.create({
        category: 'poultry',
        movementType: 'purchase',
        farm: line.farm,
        poultryType: line.poultryType,
        quantity: line.quantity,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
        notes: line.description,
      });
    } else if (line.lineType === 'feed' && line.productName) {
      const Unit = mongoose.model('Unit');
      const unit = line.unit ? await Unit.findById(line.unit) : await Unit.findOne();
      if (!unit) continue;
      await ensureFeedStock(line.productName, unit._id);
      await FeedStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: line.quantity } });
      await StockMovement.create({
        category: 'feed',
        movementType: 'purchase',
        itemName: line.productName.trim(),
        quantity: line.quantity,
        unit: unit._id,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
      });
    } else if (line.lineType === 'medicine' && line.productName) {
      const Unit = mongoose.model('Unit');
      const unit = line.unit ? await Unit.findById(line.unit) : await Unit.findOne();
      if (!unit) continue;
      await ensureMedicineStock(line.productName, unit._id);
      await MedicineStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: line.quantity } });
      await StockMovement.create({
        category: 'medicine',
        movementType: 'purchase',
        itemName: line.productName.trim(),
        quantity: line.quantity,
        unit: unit._id,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
      });
    }
  }
}

/** Reverse purchase effects (mirror apply) */
export async function reversePurchaseInvoice(inv) {
  const modelName = 'PurchaseInvoice';
  const id = inv._id;
  for (const line of inv.lines) {
    if (line.lineType === 'poultry' && line.farm && line.poultryType) {
      await PoultryStock.updateOne(
        { farm: line.farm, poultryType: line.poultryType },
        { $inc: { quantity: -line.quantity } }
      );
    } else if (line.lineType === 'feed' && line.productName) {
      await FeedStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: -line.quantity } });
    } else if (line.lineType === 'medicine' && line.productName) {
      await MedicineStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: -line.quantity } });
    }
  }
  await deleteMovementsForRef(modelName, id);
}

export async function applyStockTransferInvoice(doc) {
  const modelName = 'StockTransferInvoice';
  const id = doc._id;
  const docNum = doc.documentNumber;
  const d = doc.date;

  for (const line of doc.lines) {
    if (line.lineType !== 'poultry' || !line.poultryType) continue;
    await ensurePoultryStock(doc.fromFarm, line.poultryType);
    await ensurePoultryStock(doc.toFarm, line.poultryType);
    await PoultryStock.updateOne(
      { farm: doc.fromFarm, poultryType: line.poultryType },
      { $inc: { quantity: -line.quantity } }
    );
    await PoultryStock.updateOne(
      { farm: doc.toFarm, poultryType: line.poultryType },
      { $inc: { quantity: line.quantity } }
    );
    await StockMovement.create({
      category: 'poultry',
      movementType: 'transfer_out',
      farm: doc.fromFarm,
      poultryType: line.poultryType,
      quantity: line.quantity,
      ...ref(modelName, id),
      documentNumber: docNum,
      date: d,
      notes: line.description,
    });
    await StockMovement.create({
      category: 'poultry',
      movementType: 'transfer_in',
      farm: doc.toFarm,
      poultryType: line.poultryType,
      quantity: line.quantity,
      ...ref(modelName, id),
      documentNumber: docNum,
      date: d,
      notes: line.description,
    });
  }
}

export async function reverseStockTransferInvoice(doc) {
  for (const line of doc.lines) {
    if (line.lineType !== 'poultry' || !line.poultryType) continue;
    await PoultryStock.updateOne(
      { farm: doc.fromFarm, poultryType: line.poultryType },
      { $inc: { quantity: line.quantity } }
    );
    await PoultryStock.updateOne(
      { farm: doc.toFarm, poultryType: line.poultryType },
      { $inc: { quantity: -line.quantity } }
    );
  }
  await deleteMovementsForRef('StockTransferInvoice', doc._id);
}

export async function applySalesInvoice(inv) {
  const modelName = 'SalesInvoice';
  const id = inv._id;
  const docNum = inv.documentNumber;
  const d = inv.date;

  for (const line of inv.lines) {
    if (line.lineType === 'poultry' && line.farm && line.poultryType) {
      await PoultryStock.updateOne(
        { farm: line.farm, poultryType: line.poultryType },
        { $inc: { quantity: -line.quantity } }
      );
      await StockMovement.create({
        category: 'poultry',
        movementType: 'sale',
        farm: line.farm,
        poultryType: line.poultryType,
        quantity: line.quantity,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
        notes: line.description,
      });
    } else if (line.lineType === 'feed' && line.productName) {
      await FeedStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: -line.quantity } });
      const fs = await FeedStock.findOne({ name: line.productName.trim() });
      await StockMovement.create({
        category: 'feed',
        movementType: 'sale',
        itemName: line.productName.trim(),
        quantity: line.quantity,
        unit: fs?.unit,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
      });
    } else if (line.lineType === 'medicine' && line.productName) {
      await MedicineStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: -line.quantity } });
      const ms = await MedicineStock.findOne({ name: line.productName.trim() });
      await StockMovement.create({
        category: 'medicine',
        movementType: 'sale',
        itemName: line.productName.trim(),
        quantity: line.quantity,
        unit: ms?.unit,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
      });
    }
  }
}

export async function reverseSalesInvoice(inv) {
  for (const line of inv.lines) {
    if (line.lineType === 'poultry' && line.farm && line.poultryType) {
      await PoultryStock.updateOne(
        { farm: line.farm, poultryType: line.poultryType },
        { $inc: { quantity: line.quantity } }
      );
    } else if (line.lineType === 'feed' && line.productName) {
      await FeedStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: line.quantity } });
    } else if (line.lineType === 'medicine' && line.productName) {
      await MedicineStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: line.quantity } });
    }
  }
  await deleteMovementsForRef('SalesInvoice', inv._id);
}

export async function applySalesReturnInvoice(inv) {
  const modelName = 'SalesReturnInvoice';
  const id = inv._id;
  const docNum = inv.documentNumber;
  const d = inv.date;

  for (const line of inv.lines) {
    if (line.lineType === 'poultry' && line.farm && line.poultryType) {
      await ensurePoultryStock(line.farm, line.poultryType);
      await PoultryStock.updateOne(
        { farm: line.farm, poultryType: line.poultryType },
        { $inc: { quantity: line.quantity } }
      );
      await StockMovement.create({
        category: 'poultry',
        movementType: 'return_in',
        farm: line.farm,
        poultryType: line.poultryType,
        quantity: line.quantity,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
        notes: line.description,
      });
    } else if (line.lineType === 'feed' && line.productName) {
      const Unit = mongoose.model('Unit');
      const unit = (await FeedStock.findOne({ name: line.productName.trim() }))?.unit || (await Unit.findOne());
      if (unit) {
        await ensureFeedStock(line.productName, unit._id);
        await FeedStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: line.quantity } });
      }
      const fs = await FeedStock.findOne({ name: line.productName.trim() });
      await StockMovement.create({
        category: 'feed',
        movementType: 'return_in',
        itemName: line.productName.trim(),
        quantity: line.quantity,
        unit: fs?.unit,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
      });
    } else if (line.lineType === 'medicine' && line.productName) {
      const Unit = mongoose.model('Unit');
      const unit =
        (await MedicineStock.findOne({ name: line.productName.trim() }))?.unit || (await Unit.findOne());
      if (unit) {
        await ensureMedicineStock(line.productName, unit._id);
        await MedicineStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: line.quantity } });
      }
      const ms = await MedicineStock.findOne({ name: line.productName.trim() });
      await StockMovement.create({
        category: 'medicine',
        movementType: 'return_in',
        itemName: line.productName.trim(),
        quantity: line.quantity,
        unit: ms?.unit,
        ...ref(modelName, id),
        documentNumber: docNum,
        date: d,
      });
    }
  }
}

export async function reverseSalesReturnInvoice(inv) {
  for (const line of inv.lines) {
    if (line.lineType === 'poultry' && line.farm && line.poultryType) {
      await PoultryStock.updateOne(
        { farm: line.farm, poultryType: line.poultryType },
        { $inc: { quantity: -line.quantity } }
      );
    } else if (line.lineType === 'feed' && line.productName) {
      await FeedStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: -line.quantity } });
    } else if (line.lineType === 'medicine' && line.productName) {
      await MedicineStock.updateOne({ name: line.productName.trim() }, { $inc: { quantity: -line.quantity } });
    }
  }
  await deleteMovementsForRef('SalesReturnInvoice', inv._id);
}
