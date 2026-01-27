/**
 * Enhanced seed script for MongoDB with realistic data
 * Run with: npm run seed
 * 
 * This script uses upsert operations to be idempotent - safe to run multiple times
 */

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CUSTOMER_DATA } from '../common/customer-data';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';
import { Location, LocationSchema } from '../database/schemas/Location.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { Customer, CustomerSchema } from '../database/schemas/Customer.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountSchema } from '../database/schemas/CustomerMerchantAccount.schema';
import { Device, DeviceSchema } from '../database/schemas/Device.schema';
import { Reward, RewardSchema } from '../database/schemas/Reward.schema';
import { Transaction, TransactionSchema, TransactionType, TransactionStatus } from '../database/schemas/Transaction.schema';
import { LoyaltyLedgerEntry, LoyaltyLedgerEntrySchema } from '../database/schemas/LoyaltyLedgerEntry.schema';
import { Redemption, RedemptionSchema, RedemptionStatus } from '../database/schemas/Redemption.schema';
import { CustomerBalance, CustomerBalanceSchema } from '../database/schemas/CustomerBalance.schema';
import { v4 as uuidv4 } from 'uuid';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const PASSWORD = 'password123'; // Consistent password for all example users

async function main() {
  console.log('🌱 Seeding MongoDB database with realistic data...\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(databaseUrl);
    console.log('✅ Connected to MongoDB\n');

    // Create models
    const TenantModel = mongoose.model('Tenant', TenantSchema);
    const LocationModel = mongoose.model('Location', LocationSchema);
    const UserModel = mongoose.model('User', UserSchema);
    const CustomerModel = mongoose.model('Customer', CustomerSchema);
    const AccountModel = mongoose.model('CustomerMerchantAccount', CustomerMerchantAccountSchema);
    const DeviceModel = mongoose.model('Device', DeviceSchema);
    const RewardModel = mongoose.model('Reward', RewardSchema);
    const TransactionModel = mongoose.model('Transaction', TransactionSchema);
    const LedgerModel = mongoose.model('LoyaltyLedgerEntry', LoyaltyLedgerEntrySchema);
    const RedemptionModel = mongoose.model('Redemption', RedemptionSchema);
    const BalanceModel = mongoose.model('CustomerBalance', CustomerBalanceSchema);

    // Create demo tenant
    const tenant = await TenantModel.findOneAndUpdate(
      { _id: TENANT_ID },
      {
        _id: TENANT_ID,
        name: 'Arabian Coffee House',
        config: {
          pointsPerQAR: 0.5,
          currency: 'QAR',
        },
        isActive: true,
      },
      { upsert: true, new: true }
    ).exec();

    console.log(`✅ Created/Updated tenant: ${tenant.name}`);

    // Create multiple locations
    const locationsData = [
      { id: '00000000-0000-0000-0000-000000000002', name: 'The Pearl Branch', address: 'The Pearl-Qatar, Doha' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'City Center Branch', address: 'City Center Doha, West Bay' },
      { id: '00000000-0000-0000-0000-000000000004', name: 'Villaggio Branch', address: 'Villaggio Mall, Doha' },
    ];

    const locations = await Promise.all(
      locationsData.map(async (loc) => {
        return LocationModel.findOneAndUpdate(
          { _id: loc.id },
          {
            _id: loc.id,
            tenantId: tenant._id,
            name: loc.name,
            address: loc.address,
            isActive: true,
          },
          { upsert: true, new: true }
        ).exec();
      })
    );

    console.log(`✅ Created/Updated ${locations.length} locations`);

    // Create role-based example users
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    
    const usersData = [
      { email: 'admin@example.com', role: 'MERCHANT_ADMIN', scopes: ['merchant:*'] },
      { email: 'manager@example.com', role: 'MANAGER', scopes: ['scan:*'] },
      { email: 'cashier@example.com', role: 'CASHIER', scopes: ['scan:*'] },
      { email: 'staff@example.com', role: 'STAFF', scopes: ['scan:*'] },
    ];

    const users = await Promise.all(
      usersData.map(async (userData) => {
        return UserModel.findOneAndUpdate(
          { tenantId: tenant._id, email: userData.email },
          {
            _id: uuidv4(),
            tenantId: tenant._id,
            email: userData.email,
            hashedPassword,
            roles: [userData.role],
            scopes: userData.scopes,
            isActive: true,
          },
          { upsert: true, new: true }
        ).exec();
      })
    );

    console.log(`✅ Created/Updated ${users.length} users with role-based access`);

    // Create devices for each location
    const deviceIdentifiers = ['POS-THE-1', 'POS-CIT-1', 'POS-VIL-1'];
    const devices = await Promise.all(
      locations.map((location, index) =>
        DeviceModel.findOneAndUpdate(
          { tenantId: tenant._id, deviceIdentifier: deviceIdentifiers[index] },
          {
            _id: uuidv4(),
            tenantId: tenant._id,
            locationId: location._id,
            deviceIdentifier: deviceIdentifiers[index],
            registeredByUserId: users[0]._id,
            isActive: true,
          },
          { upsert: true, new: true }
        ).exec()
      )
    );

    console.log(`✅ Created/Updated ${devices.length} devices`);

    // Create customers
    await AccountModel.deleteMany({ tenantId: tenant._id }).exec();
    await BalanceModel.deleteMany({ tenantId: tenant._id }).exec();

    const customers = await Promise.all(
      CUSTOMER_DATA.map(async () => {
        const qrTokenSecret = crypto.randomBytes(32).toString('hex');
        return new CustomerModel({
          _id: uuidv4(),
          qrTokenSecret,
          rotationIntervalSec: 30,
        }).save();
      })
    );

    console.log(`✅ Created ${customers.length} customers`);

    // Create customer-merchant accounts
    const balanceAmounts = Array.from({ length: CUSTOMER_DATA.length }, (_, i) => {
      if (i < 12) return [0, 25, 50, 75, 100, 125, 150, 200, 250, 300, 350, 450][i] || 0;
      if (i < 20) return [100, 150, 200, 75, 250, 300, 175, 400][i - 12] || 0;
      return [50, 125, 0, 200, 75][i - 20] || 0;
    });

    const accounts = await Promise.all(
      customers.map((customer, index) =>
        AccountModel.findOneAndUpdate(
          { customerId: customer._id, tenantId: tenant._id },
          {
            _id: uuidv4(),
            customerId: customer._id,
            tenantId: tenant._id,
            membershipStatus: index < 20 ? 'ACTIVE' : 'INACTIVE',
          },
          { upsert: true, new: true }
        ).exec()
      )
    );

    console.log(`✅ Created/Updated ${accounts.length} customer accounts`);

    // Create customer balances
    await Promise.all(
      customers.map((customer, index) =>
        BalanceModel.findOneAndUpdate(
          { tenantId: tenant._id, customerId: customer._id },
          {
            _id: uuidv4(),
            tenantId: tenant._id,
            customerId: customer._id,
            balance: balanceAmounts[index],
            lastUpdatedAt: new Date(),
          },
          { upsert: true, new: true }
        ).exec()
      )
    );

    console.log(`✅ Created/Updated customer balances`);

    // Create rewards
    const rewardsData = [
      { name: 'Free Coffee', pointsRequired: 100, description: 'Redeem for one free coffee of any size' },
      { name: 'Free Pastry', pointsRequired: 75, description: 'Redeem for one free pastry from our selection' },
      { name: '10% Discount', pointsRequired: 50, description: 'Get 10% off your next purchase' },
      { name: 'Free Cappuccino', pointsRequired: 120, description: 'Redeem for one free cappuccino' },
      { name: 'Buy 1 Get 1 Free', pointsRequired: 150, description: 'Buy one coffee, get one free' },
      { name: 'Free Meal Combo', pointsRequired: 300, description: 'Redeem for a free coffee and pastry combo' },
    ];

    const rewards = await Promise.all(
      rewardsData.map((reward) =>
        RewardModel.findOneAndUpdate(
          { tenantId: tenant._id, name: reward.name },
          {
            _id: uuidv4(),
            tenantId: tenant._id,
            name: reward.name,
            pointsRequired: reward.pointsRequired,
            description: reward.description,
            isActive: true,
          },
          { upsert: true, new: true }
        ).exec()
      )
    );

    console.log(`✅ Created/Updated ${rewards.length} rewards`);

    // Clear existing transactions
    await LedgerModel.deleteMany({ tenantId: tenant._id }).exec();
    await RedemptionModel.deleteMany({ tenantId: tenant._id }).exec();
    await TransactionModel.deleteMany({ tenantId: tenant._id }).exec();

    console.log(`✅ Cleared existing transactions for clean reseed`);

    // Create welcome transactions with customer metadata
    await Promise.all(
      customers.map((customer, index) => {
        const customerInfo = CUSTOMER_DATA[index];
        const welcomeIdempotencyKey = `welcome-${customer._id}-${tenant._id}`;
        
        return TransactionModel.findOneAndUpdate(
          { idempotencyKey: welcomeIdempotencyKey },
          {
            _id: uuidv4(),
            tenantId: tenant._id,
            customerId: customer._id,
            type: TransactionType.ISSUE,
            amount: 0,
            status: TransactionStatus.COMPLETED,
            idempotencyKey: welcomeIdempotencyKey,
            deviceId: devices[0]._id,
            metadata: {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              isWelcomeTransaction: true,
            },
            createdAt: new Date(customerInfo.joinDate),
          },
          { upsert: true, new: true }
        ).exec().catch(() => null);
      })
    );

    console.log(`✅ Created welcome transactions with customer metadata`);

    console.log('\n✅ Seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`  - 1 Tenant: ${tenant.name}`);
    console.log(`  - ${locations.length} Locations`);
    console.log(`  - ${users.length} Users (role-based)`);
    console.log(`  - ${devices.length} Devices`);
    console.log(`  - ${customers.length} Customers`);
    console.log(`  - ${rewards.length} Rewards`);
    console.log('\n🔑 Login Credentials (Password for all: password123):');
    console.log('  MERCHANT_ADMIN: admin@example.com');
    console.log('  MANAGER: manager@example.com');
    console.log('  CASHIER: cashier@example.com');
    console.log('  STAFF: staff@example.com');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

main().catch((e) => {
  console.error('\n❌ Seeding failed:', e);
  process.exit(1);
});
