/**
 * Clean minimal seed for development testing.
 * Wipes all collections and creates 2 test users:
 *   merchant@test.com / password  (MERCHANT_ADMIN, onboarding complete)
 *   customer@test.com / password  (CUSTOMER, no merchant link → tests auto-enroll on first scan)
 *
 * Run: npm run seed
 */

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TenantSchema } from './database/schemas/Tenant.schema';
import { UserSchema } from './database/schemas/User.schema';
import { CustomerSchema } from './database/schemas/Customer.schema';
import { LocationSchema } from './database/schemas/Location.schema';
import { RewardSchema } from './database/schemas/Reward.schema';
import { RulesetSchema } from './database/schemas/Ruleset.schema';
import { CustomerMerchantAccountSchema } from './database/schemas/CustomerMerchantAccount.schema';
import { v4 as uuidv4 } from 'uuid';

const MERCHANT_TENANT_ID = 'test-merchant-tenant';
const STAMP_MERCHANT_TENANT_ID = 'test-stamp-merchant-tenant';
const PLATFORM_TENANT_ID = 'sharkband-platform';
const TEST_CUSTOMER_ID = 'test-customer-id';
const PASSWORD = 'password';

async function main() {
  console.log('🌱 Running clean seed...\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  await mongoose.connect(databaseUrl);
  console.log('✅ Connected to MongoDB\n');

  // Wipe all known collections
  const collections = [
    'tenants', 'users', 'customers', 'customer_merchant_accounts',
    'locations', 'rewards', 'rulesets', 'transactions',
    'loyalty_ledger_entries', 'redemptions', 'customer_balances',
    'devices', 'audit_logs', 'pilot_onboarding_funnels',
  ];

  for (const col of collections) {
    try {
      await mongoose.connection.collection(col).deleteMany({});
    } catch {
      // Collection may not exist yet — that's fine
    }
  }
  console.log('✅ Wiped all collections\n');

  // Register models
  const TenantModel = mongoose.model('Tenant', TenantSchema);
  const UserModel = mongoose.model('User', UserSchema);
  const CustomerModel = mongoose.model('Customer', CustomerSchema);
  const LocationModel = mongoose.model('Location', LocationSchema);
  const RewardModel = mongoose.model('Reward', RewardSchema);
  const RulesetModel = mongoose.model('Ruleset', RulesetSchema);

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  // Platform tenant (required so customer JWTs resolve to an active tenant)
  await new TenantModel({
    _id: PLATFORM_TENANT_ID,
    name: 'SharkBand Platform',
    config: { excludeFromDiscover: true },
    isActive: true,
    hasCompletedOnboarding: true,
  }).save();
  console.log('✅ Created platform tenant');

  // Merchant tenant
  await new TenantModel({
    _id: MERCHANT_TENANT_ID,
    name: 'Test Restaurant',
    config: { excludeFromDiscover: true },
    isActive: true,
    hasCompletedOnboarding: true,
  }).save();
  console.log('✅ Created merchant tenant');

  // Merchant admin user
  await new UserModel({
    _id: uuidv4(),
    tenantId: MERCHANT_TENANT_ID,
    name: 'Test Merchant',
    email: 'merchant@test.com',
    hashedPassword,
    roles: ['MERCHANT_ADMIN'],
    scopes: ['merchant:*'],
    isActive: true,
  }).save();
  console.log('✅ Created merchant user: merchant@test.com / password');

  // Platform admin user (required for the admin dashboard)
  await new UserModel({
    _id: uuidv4(),
    tenantId: PLATFORM_TENANT_ID,
    name: 'Platform Admin',
    email: 'admin@sharkband.io',
    hashedPassword,
    roles: ['PLATFORM_ADMIN'],
    scopes: ['platform:*'],
    isActive: true,
  }).save();
  console.log('✅ Created platform admin user: admin@sharkband.io / password');

  // Customer doc
  const customer = await new CustomerModel({
    _id: TEST_CUSTOMER_ID,
    qrTokenSecret: crypto.randomBytes(32).toString('hex'),
    rotationIntervalSec: 300,
  }).save();
  console.log('✅ Created customer doc');

  // Customer user
  await new UserModel({
    _id: uuidv4(),
    tenantId: PLATFORM_TENANT_ID,
    name: 'Test Customer',
    email: 'customer@test.com',
    hashedPassword,
    roles: ['CUSTOMER'],
    scopes: ['customer:*'],
    customerId: customer._id,
    isActive: true,
  }).save();
  console.log('✅ Created customer user: customer@test.com / password');

  // Location for merchant
  await new LocationModel({
    _id: uuidv4(),
    tenantId: MERCHANT_TENANT_ID,
    name: 'Main Branch',
    address: 'Doha, Qatar',
    isActive: true,
  }).save();
  console.log('✅ Created location');

  // Reward
  await new RewardModel({
    _id: uuidv4(),
    tenantId: MERCHANT_TENANT_ID,
    name: 'Free Coffee',
    pointsRequired: 100,
    description: 'Redeem for one free coffee',
    isActive: true,
  }).save();
  console.log('✅ Created reward: Free Coffee (100 pts)');

  // Ruleset
  await new RulesetModel({
    _id: uuidv4(),
    tenantId: MERCHANT_TENANT_ID,
    ruleType: 'POINTS_PER_CURRENCY',
    config: { pointsPerCurrency: 0.5 },
    effectiveFrom: new Date(),
  }).save();
  console.log('✅ Created ruleset: 0.5 points per QAR');

  // ── Stamps merchant ──────────────────────────────────────────────
  await new TenantModel({
    _id: STAMP_MERCHANT_TENANT_ID,
    name: 'Test Cafe (Stamps)',
    config: { excludeFromDiscover: true },
    isActive: true,
    hasCompletedOnboarding: true,
  }).save();
  console.log('✅ Created stamp merchant tenant');

  await new UserModel({
    _id: uuidv4(),
    tenantId: STAMP_MERCHANT_TENANT_ID,
    name: 'Stamp Merchant',
    email: 'stamps@test.com',
    hashedPassword,
    roles: ['MERCHANT_ADMIN'],
    scopes: ['merchant:*'],
    isActive: true,
  }).save();
  console.log('✅ Created stamp merchant user: stamps@test.com / password');

  await new LocationModel({
    _id: uuidv4(),
    tenantId: STAMP_MERCHANT_TENANT_ID,
    name: 'Cafe Main Branch',
    address: 'Doha, Qatar',
    isActive: true,
  }).save();
  console.log('✅ Created stamp merchant location');

  // STAMP_CARD ruleset — 5 stamps required for a reward
  await new RulesetModel({
    _id: uuidv4(),
    tenantId: STAMP_MERCHANT_TENANT_ID,
    ruleType: 'STAMP_CARD',
    config: { stampsRequired: 5 },
    effectiveFrom: new Date(),
  }).save();
  console.log('✅ Created stamp ruleset: 5 stamps required');

  // Stamps reward
  await new RewardModel({
    _id: uuidv4(),
    tenantId: STAMP_MERCHANT_TENANT_ID,
    name: 'Free Latte',
    rewardType: 'stamps',
    stampsCost: 5,
    description: 'Collect 5 stamps and get a free latte',
    isActive: true,
  }).save();
  console.log('✅ Created stamp reward: Free Latte (5 stamps)');

  console.log('\n✅ Seed complete!');
  console.log('\n🔑 Test Credentials:');
  console.log('  Platform admin:  admin@sharkband.io / password');
  console.log('  Points merchant: merchant@test.com / password');
  console.log('  Stamps merchant: stamps@test.com / password');
  console.log('  Customer:        customer@test.com / password');
  console.log('\n💡 No CustomerMerchantAccount created — first scan will auto-enroll the customer.');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
