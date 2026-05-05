/**
 * Seeds reference data and sample vouchers for local development.
 * Run: npm run seed (from backend folder) with MongoDB running.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDb } from '../config/db.js';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { Farm } from '../models/Farm.js';
import { PoultryType } from '../models/PoultryType.js';
import { Unit } from '../models/Unit.js';
import { AccountHead } from '../models/AccountHead.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { SalesInvoice } from '../models/SalesInvoice.js';
import { ReceiptVoucher } from '../models/ReceiptVoucher.js';
import { PaymentVoucher } from '../models/PaymentVoucher.js';
import { DocumentSequence } from '../models/DocumentSequence.js';
import { applyPurchaseInvoice, applySalesInvoice } from '../services/inventoryService.js';

async function clearTransactional() {
  const cols = [
    'purchaseinvoices',
    'salesinvoices',
    'salesreturninvoices',
    'stocktransferinvoices',
    'receiptvouchers',
    'paymentvouchers',
    'bankvouchers',
    'journalvouchers',
    'stockmovements',
    'poultrystocks',
    'feedstocks',
    'medicinestocks',
    'documentsequences',
  ];
  for (const c of cols) {
    try {
      await mongoose.connection.collection(c).deleteMany({});
    } catch {
      /* collection may not exist yet */
    }
  }
}

async function ensureFarm(name, location) {
  let f = await Farm.findOne({ name });
  if (!f) f = await Farm.create({ name, location });
  else if (location) {
    f.location = location;
    await f.save();
  }
  return f;
}

async function ensurePoultryType(name, code, description) {
  let p = await PoultryType.findOne({ name });
  if (!p) p = await PoultryType.create({ name, code, description });
  return p;
}

async function ensureUnit(name, abbreviation) {
  let u = await Unit.findOne({ abbreviation });
  if (!u) u = await Unit.create({ name, abbreviation });
  return u;
}

async function ensureAccount(filter, data) {
  let h = await AccountHead.findOne(filter);
  if (!h) h = await AccountHead.create({ ...filter, ...data });
  else {
    Object.assign(h, data);
    await h.save();
  }
  return h;
}

async function seed() {
  await connectDb();
  await clearTransactional();

  /** Roles: use findOne + create so we never depend on upsert merge quirks. */
  let adminRole = await Role.findOne({ name: 'Administrator' });
  if (!adminRole) {
    adminRole = await Role.create({ name: 'Administrator', description: 'Full access', permissions: ['*'] });
  } else {
    adminRole.description = 'Full access';
    adminRole.permissions = ['*'];
    await adminRole.save();
  }
  let operatorRole = await Role.findOne({ name: 'Operator' });
  if (!operatorRole) {
    operatorRole = await Role.create({ name: 'Operator', description: 'Day-to-day operations', permissions: [] });
  }

  /** Default admin user: explicit create/update (findOneAndUpdate+upsert can skip required fields on some drivers). */
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminEmail = 'admin@farm.local';
  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      passwordHash,
      role: adminRole._id,
      isActive: true,
    });
    console.log('Created default user:', adminEmail);
  } else {
    adminUser.name = 'System Admin';
    adminUser.passwordHash = passwordHash;
    adminUser.role = adminRole._id;
    adminUser.isActive = true;
    await adminUser.save();
    console.log('Updated default user:', adminEmail);
  }

  const farmA = await ensureFarm('North Farm', 'Rural Zone A');
  const farmB = await ensureFarm('South Farm', 'Rural Zone B');
  const broiler = await ensurePoultryType('Broiler', 'BR', 'Meat birds');
  const layer = await ensurePoultryType('Layer', 'LY', 'Egg production');
  const kg = await ensureUnit('Kilogram', 'KG');
  const bag = await ensureUnit('Bag', 'BAG');
  await ensureUnit('Piece', 'PC');

  const cash = await ensureAccount({ name: 'Main Cash', type: 'cash' }, { openingBalance: 50000 });
  const bank = await ensureAccount({ name: 'Operating Bank', type: 'bank' }, { openingBalance: 120000 });
  const supplier = await ensureAccount({ name: 'Agri Supplies Co.', type: 'supplier' }, { phone: '555-0100' });
  const customer = await ensureAccount({ name: 'City Retail Outlet', type: 'customer' }, { phone: '555-0200' });
  const expense = await ensureAccount({ name: 'Utilities & Misc', type: 'expense' }, {});

  const pi = await PurchaseInvoice.create({
    documentNumber: 'PI-2026-0001',
    date: new Date(),
    supplier: supplier._id,
    lines: [
      {
        lineType: 'poultry',
        description: 'Day-old chicks',
        quantity: 500,
        unitPrice: 2.5,
        amount: 1250,
        farm: farmA._id,
        poultryType: broiler._id,
      },
      {
        lineType: 'feed',
        description: 'Starter feed',
        quantity: 40,
        unitPrice: 18,
        amount: 720,
        productName: 'Starter Feed Mix',
        unit: bag._id,
      },
    ],
    subtotal: 1970,
    taxAmount: 0,
    total: 1970,
    notes: 'Seeded purchase',
    createdBy: adminUser?._id,
  });
  const y = new Date().getFullYear();
  await DocumentSequence.findOneAndUpdate({ key: `PI_${y}` }, { lastNumber: 1 }, { upsert: true });
  await applyPurchaseInvoice(pi);

  const si = await SalesInvoice.create({
    documentNumber: 'SI-2026-0001',
    date: new Date(),
    customer: customer._id,
    lines: [
      {
        lineType: 'poultry',
        description: 'Live broiler batch',
        quantity: 200,
        unitPrice: 6,
        unitCost: 4.2,
        amount: 1200,
        farm: farmA._id,
        poultryType: broiler._id,
      },
    ],
    subtotal: 1200,
    taxAmount: 0,
    total: 1200,
    notes: 'Seeded sale',
    createdBy: adminUser?._id,
  });
  await DocumentSequence.findOneAndUpdate({ key: `SI_${y}` }, { lastNumber: 1 }, { upsert: true });
  await applySalesInvoice(si);

  await ReceiptVoucher.create({
    documentNumber: 'RV-2026-0001',
    date: new Date(),
    receivedFrom: customer._id,
    depositTo: cash._id,
    amount: 800,
    paymentMode: 'cash',
    notes: 'Partial collection',
    createdBy: adminUser?._id,
  });
  await DocumentSequence.findOneAndUpdate({ key: `RV_${y}` }, { lastNumber: 1 }, { upsert: true });

  await PaymentVoucher.create({
    documentNumber: 'PV-2026-0001',
    date: new Date(),
    paidTo: supplier._id,
    paidFrom: bank._id,
    amount: 500,
    paymentMode: 'bank',
    notes: 'Supplier advance',
    createdBy: adminUser?._id,
  });
  await PaymentVoucher.create({
    documentNumber: 'PV-2026-0002',
    date: new Date(),
    paidTo: expense._id,
    paidFrom: cash._id,
    amount: 150,
    paymentMode: 'cash',
    notes: 'Farm utilities',
    createdBy: adminUser?._id,
  });
  await DocumentSequence.findOneAndUpdate({ key: `PV_${y}` }, { lastNumber: 2 }, { upsert: true });

  console.log('Seed completed. Login: admin@farm.local / admin123');
  console.log('Farms:', farmA.name, farmB.name, '| Units:', kg.abbreviation, bag.abbreviation, '| Layer type:', layer.name);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
