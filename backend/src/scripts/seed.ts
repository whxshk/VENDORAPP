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
import { Location, LocationSchema, LocationDocument } from '../database/schemas/Location.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { Customer, CustomerSchema, CustomerDocument } from '../database/schemas/Customer.schema';
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

  // Use DATABASE_URL from env or fallback to MongoDB Atlas connection string
  // If using Atlas, the user's connection string is: mongodb+srv://Talal:Sharkband123@web2.9qnlv.mongodb.net/
  let databaseUrl = process.env.DATABASE_URL || 'mongodb+srv://Talal:Sharkband123@web2.9qnlv.mongodb.net/';

  // Ensure database name "Waddy" is included
  // Check if database name is already specified by looking for a path component
  // after the authority section (host:port or host)
  const queryIndex = databaseUrl.indexOf('?');
  const urlWithoutQuery = queryIndex >= 0 ? databaseUrl.substring(0, queryIndex) : databaseUrl;
  
  // Find the authority section (everything after ://)
  const protocolIndex = urlWithoutQuery.indexOf('://');
  let hasDatabaseName = false;
  if (protocolIndex >= 0) {
    const afterProtocol = urlWithoutQuery.substring(protocolIndex + 3);
    // Find the first / after the authority (host:port or host)
    // For mongodb://host:port/db, find / after port
    // For mongodb+srv://host/db, find / after host
    const firstSlashAfterAuth = afterProtocol.indexOf('/');
    if (firstSlashAfterAuth >= 0) {
      // Check if there's a database name after the first /
      let pathAfterAuth = afterProtocol.substring(firstSlashAfterAuth + 1);
      // Remove trailing slashes
      pathAfterAuth = pathAfterAuth.replace(/\/+$/, '');
      // Database name should be non-empty, not contain @ or : (authority characters),
      // and not contain / (which would indicate an invalid path segment)
      hasDatabaseName = pathAfterAuth.length > 0 
        && !pathAfterAuth.includes('@') 
        && !pathAfterAuth.includes(':')
        && !pathAfterAuth.includes('/');
    }
  }
  const hasQueryParams = queryIndex >= 0;
  
  if (!hasDatabaseName) {
    // No database name specified - append it
    if (urlWithoutQuery.endsWith('/')) {
      // URL ends with / - append database name
      databaseUrl = hasQueryParams
        ? `${urlWithoutQuery}Waddy?${databaseUrl.substring(queryIndex + 1)}`
        : `${urlWithoutQuery}Waddy?retryWrites=true&w=majority`;
    } else {
      // URL doesn't end with / - append /database
      databaseUrl = hasQueryParams
        ? `${urlWithoutQuery}/Waddy?${databaseUrl.substring(queryIndex + 1)}`
        : `${urlWithoutQuery}/Waddy?retryWrites=true&w=majority`;
    }
  } else if (!hasQueryParams) {
    // Has database name but no query params - add them
    databaseUrl = `${databaseUrl}?retryWrites=true&w=majority`;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(databaseUrl);
    console.log('✅ Connected to MongoDB (Waddy database)\n');

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
      { name: 'Admin User', email: 'admin@example.com', role: 'MERCHANT_ADMIN', scopes: ['merchant:*'] },
      { name: 'Manager User', email: 'manager@example.com', role: 'MANAGER', scopes: ['scan:*'] },
      { name: 'Cashier User', email: 'cashier@example.com', role: 'CASHIER', scopes: ['scan:*'] },
      { name: 'Staff User', email: 'staff@example.com', role: 'STAFF', scopes: ['scan:*'] },
    ];

    const users = await Promise.all(
      usersData.map(async (userData) => {
        return UserModel.findOneAndUpdate(
          { tenantId: tenant._id, email: userData.email },
          {
            $set: {
              tenantId: tenant._id,
              name: userData.name,
              email: userData.email,
              hashedPassword,
              roles: [userData.role],
              scopes: userData.scopes,
              isActive: true,
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
          },
          { upsert: true, new: true }
        ).exec();
      })
    );

    console.log(`✅ Created/Updated ${users.length} users with role-based access`);

    // Create devices for each location
    const deviceIdentifiers = ['POS-THE-1', 'POS-CIT-1', 'POS-VIL-1'];
    const devices = await Promise.all(
      locations.map((location: any, index: number) =>
        DeviceModel.findOneAndUpdate(
          { tenantId: tenant._id, deviceIdentifier: deviceIdentifiers[index] },
          {
            $set: {
              tenantId: tenant._id,
              locationId: location._id,
              deviceIdentifier: deviceIdentifiers[index],
              registeredByUserId: users[0]._id,
              isActive: true,
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
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
      customers.map((customer: any, index: number) =>
        AccountModel.findOneAndUpdate(
          { customerId: customer._id, tenantId: tenant._id },
          {
            $set: {
              customerId: customer._id,
              tenantId: tenant._id,
              membershipStatus: index < 20 ? 'ACTIVE' : 'INACTIVE',
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
          },
          { upsert: true, new: true }
        ).exec()
      )
    );

    console.log(`✅ Created/Updated ${accounts.length} customer accounts`);

    // Create customer balances
    await Promise.all(
      customers.map((customer: any, index: number) =>
        BalanceModel.findOneAndUpdate(
          { tenantId: tenant._id, customerId: customer._id },
          {
            $set: {
              tenantId: tenant._id,
              customerId: customer._id,
              balance: balanceAmounts[index],
              lastUpdatedAt: new Date(),
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
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
            $set: {
              tenantId: tenant._id,
              name: reward.name,
              pointsRequired: reward.pointsRequired,
              description: reward.description,
              isActive: true,
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
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

    // Create initial transactions and ledger entries with correct point amounts
    // Distribute transactions across all branches
    const locationNames = ['The Pearl Branch', 'City Center Branch', 'Villaggio Branch'];
    
    // Track running balance for each customer
    const customerBalances = new Map<string, number>();
    
    await Promise.all(
      customers.map(async (customer: any, index: number) => {
        const customerInfo = CUSTOMER_DATA[index];
        const targetBalance = balanceAmounts[index];
        
        // Determine preferred location based on customer data
        const preferredLocationIndex = locationNames.findIndex(
          (name) => customerInfo.preferredLocation?.includes(name.split(' ')[0])
        );
        const primaryLocationIdx = preferredLocationIndex >= 0 ? preferredLocationIndex : index % 3;
        
        // Create welcome transaction at preferred location
        const welcomeIdempotencyKey = `welcome-${customer._id}-${tenant._id}`;
        const welcomeTransactionId = uuidv4();
        const welcomeAmount = Math.min(100, targetBalance); // Initial welcome bonus
        
        const welcomeTransaction = await TransactionModel.findOneAndUpdate(
          { idempotencyKey: welcomeIdempotencyKey },
          {
            $set: {
              tenantId: tenant._id,
              customerId: customer._id,
              type: TransactionType.ISSUE,
              amount: welcomeAmount,
              status: TransactionStatus.COMPLETED,
              idempotencyKey: welcomeIdempotencyKey,
              deviceId: devices[primaryLocationIdx]._id,
              metadata: {
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                customerPhone: customerInfo.phone,
                isWelcomeTransaction: true,
                locationName: locationNames[primaryLocationIdx],
              },
              createdAt: new Date(customerInfo.joinDate),
            },
            $setOnInsert: {
              _id: welcomeTransactionId,
            },
          },
          { upsert: true, new: true }
        ).exec().catch(() => null);

        let runningBalance = welcomeAmount;
        
        if (welcomeTransaction) {
          await LedgerModel.findOneAndUpdate(
            { tenantId: tenant._id, idempotencyKey: welcomeIdempotencyKey, operationType: 'TRANSACTION' },
            {
              $set: {
                tenantId: tenant._id,
                customerId: customer._id,
                transactionId: welcomeTransaction._id,
                amount: welcomeAmount,
                balanceAfter: runningBalance,
                idempotencyKey: welcomeIdempotencyKey,
                operationType: 'TRANSACTION',
                createdAt: new Date(customerInfo.joinDate),
              },
              $setOnInsert: {
                _id: uuidv4(),
              },
            },
            { upsert: true, new: true }
          ).exec().catch(() => null);
        }

        // Create additional transactions to reach target balance, spread across locations
        const remainingPoints = targetBalance - welcomeAmount;
        if (remainingPoints > 0) {
          // Create 2-5 additional earn transactions at different locations
          const numAdditionalTx = Math.min(5, Math.ceil(remainingPoints / 50));
          const pointsPerTx = Math.floor(remainingPoints / numAdditionalTx);
          
          for (let txNum = 0; txNum < numAdditionalTx; txNum++) {
            // Rotate through different locations
            const locationIdx = (primaryLocationIdx + txNum) % 3;
            const txAmount = txNum === numAdditionalTx - 1 
              ? remainingPoints - (pointsPerTx * (numAdditionalTx - 1)) // Last tx gets remainder
              : pointsPerTx;
            
            if (txAmount <= 0) continue;
            
            const txIdempotencyKey = `earn-${customer._id}-${tenant._id}-${txNum}`;
            const txId = uuidv4();
            const txDate = new Date(customerInfo.joinDate);
            txDate.setDate(txDate.getDate() + txNum + 1); // Spread dates
            
            const transaction = await TransactionModel.findOneAndUpdate(
              { idempotencyKey: txIdempotencyKey },
              {
                $set: {
                  tenantId: tenant._id,
                  customerId: customer._id,
                  type: TransactionType.ISSUE,
                  amount: txAmount,
                  status: TransactionStatus.COMPLETED,
                  idempotencyKey: txIdempotencyKey,
                  deviceId: devices[locationIdx]._id,
                  metadata: {
                    customerName: customerInfo.name,
                    customerEmail: customerInfo.email,
                    customerPhone: customerInfo.phone,
                    locationName: locationNames[locationIdx],
                    purchaseAmount: (txAmount * 2).toFixed(2), // Simulated purchase
                  },
                  createdAt: txDate,
                },
                $setOnInsert: {
                  _id: txId,
                },
              },
              { upsert: true, new: true }
            ).exec().catch(() => null);

            if (transaction) {
              runningBalance += txAmount;
              await LedgerModel.findOneAndUpdate(
                { tenantId: tenant._id, idempotencyKey: txIdempotencyKey, operationType: 'TRANSACTION' },
                {
                  $set: {
                    tenantId: tenant._id,
                    customerId: customer._id,
                    transactionId: transaction._id,
                    amount: txAmount,
                    balanceAfter: runningBalance,
                    idempotencyKey: txIdempotencyKey,
                    operationType: 'TRANSACTION',
                    createdAt: txDate,
                  },
                  $setOnInsert: {
                    _id: uuidv4(),
                  },
                },
                { upsert: true, new: true }
              ).exec().catch(() => null);
            }
          }
        }
        
        customerBalances.set(customer._id, runningBalance);
        return welcomeTransaction;
      })
    );

    console.log(`✅ Created initial transactions and ledger entries with correct point amounts`);
    console.log(`   - Transactions distributed across: ${locationNames.join(', ')}`);

    // Create some additional random transactions across all branches for more realistic data
    // First, add more earn transactions to build up balances
    const earnTxCount = 20;
    console.log(`\n📝 Creating ${earnTxCount} earn transactions to build customer balances...`);
    
    for (let i = 0; i < earnTxCount; i++) {
      const customerIdx = Math.floor(Math.random() * customers.length);
      const customer = customers[customerIdx];
      const customerInfo = CUSTOMER_DATA[customerIdx];
      const locationIdx = Math.floor(Math.random() * 3);
      const txAmount = Math.floor(Math.random() * 80) + 20; // 20-100 points
      
      const currentBalance = customerBalances.get(customer._id) || 0;
      const txIdempotencyKey = `earn-extra-${customer._id}-${tenant._id}-${i}-${Date.now()}`;
      const txDate = new Date();
      txDate.setDate(txDate.getDate() - Math.floor(Math.random() * 10) - 3); // 3-13 days ago
      
      const transaction = await TransactionModel.findOneAndUpdate(
        { idempotencyKey: txIdempotencyKey },
        {
          $set: {
            tenantId: tenant._id,
            customerId: customer._id,
            type: TransactionType.ISSUE,
            amount: txAmount,
            status: TransactionStatus.COMPLETED,
            idempotencyKey: txIdempotencyKey,
            deviceId: devices[locationIdx]._id,
            metadata: {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              locationName: locationNames[locationIdx],
            },
            createdAt: txDate,
          },
          $setOnInsert: {
            _id: uuidv4(),
          },
        },
        { upsert: true, new: true }
      ).exec().catch(() => null);

      if (transaction) {
        const newBalance = currentBalance + txAmount;
        customerBalances.set(customer._id, newBalance);
        
        await LedgerModel.findOneAndUpdate(
          { tenantId: tenant._id, idempotencyKey: txIdempotencyKey, operationType: 'TRANSACTION' },
          {
            $set: {
              tenantId: tenant._id,
              customerId: customer._id,
              transactionId: transaction._id,
              amount: txAmount,
              balanceAfter: newBalance,
              idempotencyKey: txIdempotencyKey,
              operationType: 'TRANSACTION',
              createdAt: txDate,
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
          },
          { upsert: true, new: true }
        ).exec().catch(() => null);
      }
    }
    
    console.log(`✅ Created ${earnTxCount} earn transactions`);

    // Now create redemption transactions for customers with sufficient balance
    const redeemTxCount = 12;
    console.log(`\n📝 Creating ${redeemTxCount} redemption transactions...`);
    
    // Find customers with enough balance to redeem
    const customersWithBalance = customers.filter((c: any) => {
      const balance = customerBalances.get(c._id) || 0;
      return balance >= 30;
    });
    
    for (let i = 0; i < Math.min(redeemTxCount, customersWithBalance.length); i++) {
      const customer = customersWithBalance[i % customersWithBalance.length];
      const customerIdx = customers.findIndex((c: any) => c._id === customer._id);
      const customerInfo = CUSTOMER_DATA[customerIdx];
      const locationIdx = Math.floor(Math.random() * 3);
      
      const currentBalance = customerBalances.get(customer._id) || 0;
      const txAmount = Math.min(currentBalance - 10, Math.floor(Math.random() * 40) + 20); // 20-60 points, leave at least 10
      
      if (txAmount <= 0) continue;
      
      const txIdempotencyKey = `redeem-${customer._id}-${tenant._id}-${i}-${Date.now()}`;
      const txDate = new Date();
      txDate.setDate(txDate.getDate() - Math.floor(Math.random() * 5)); // Within last 5 days
      
      const transaction = await TransactionModel.findOneAndUpdate(
        { idempotencyKey: txIdempotencyKey },
        {
          $set: {
            tenantId: tenant._id,
            customerId: customer._id,
            type: TransactionType.REDEEM,
            amount: txAmount,
            status: TransactionStatus.COMPLETED,
            idempotencyKey: txIdempotencyKey,
            deviceId: devices[locationIdx]._id,
            metadata: {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              locationName: locationNames[locationIdx],
              rewardRedeemed: 'Points Redemption',
            },
            createdAt: txDate,
          },
          $setOnInsert: {
            _id: uuidv4(),
          },
        },
        { upsert: true, new: true }
      ).exec().catch(() => null);

      if (transaction) {
        const newBalance = currentBalance - txAmount;
        customerBalances.set(customer._id, newBalance);
        
        await LedgerModel.findOneAndUpdate(
          { tenantId: tenant._id, idempotencyKey: txIdempotencyKey, operationType: 'TRANSACTION' },
          {
            $set: {
              tenantId: tenant._id,
              customerId: customer._id,
              transactionId: transaction._id,
              amount: -txAmount,
              balanceAfter: newBalance,
              idempotencyKey: txIdempotencyKey,
              operationType: 'TRANSACTION',
              createdAt: txDate,
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
          },
          { upsert: true, new: true }
        ).exec().catch(() => null);
      }
    }
    
    console.log(`✅ Created redemption transactions`);

    // Create additional mixed transactions
    const additionalTxCount = 10;
    console.log(`\n📝 Creating ${additionalTxCount} additional mixed transactions...`);
    
    for (let i = 0; i < additionalTxCount; i++) {
      const customerIdx = Math.floor(Math.random() * customers.length);
      const customer = customers[customerIdx];
      const customerInfo = CUSTOMER_DATA[customerIdx];
      const locationIdx = Math.floor(Math.random() * 3);
      const isEarn = Math.random() > 0.4; // 60% earn, 40% redeem
      
      const currentBalance = customerBalances.get(customer._id) || 0;
      let txAmount: number;
      let txType: TransactionType;
      
      if (isEarn || currentBalance < 25) {
        txType = TransactionType.ISSUE;
        txAmount = Math.floor(Math.random() * 50) + 10; // 10-60 points
      } else {
        txType = TransactionType.REDEEM;
        txAmount = Math.min(currentBalance - 5, Math.floor(Math.random() * 30) + 10); // 10-40 points
        if (txAmount <= 0) {
          txType = TransactionType.ISSUE;
          txAmount = Math.floor(Math.random() * 50) + 10;
        }
      }
      
      const txIdempotencyKey = `extra-${customer._id}-${tenant._id}-${i}-${Date.now()}`;
      const txDate = new Date();
      txDate.setDate(txDate.getDate() - Math.floor(Math.random() * 14)); // Within last 2 weeks
      
      const transaction = await TransactionModel.findOneAndUpdate(
        { idempotencyKey: txIdempotencyKey },
        {
          $set: {
            tenantId: tenant._id,
            customerId: customer._id,
            type: txType,
            amount: txAmount,
            status: TransactionStatus.COMPLETED,
            idempotencyKey: txIdempotencyKey,
            deviceId: devices[locationIdx]._id,
            metadata: {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              locationName: locationNames[locationIdx],
            },
            createdAt: txDate,
          },
          $setOnInsert: {
            _id: uuidv4(),
          },
        },
        { upsert: true, new: true }
      ).exec().catch(() => null);

      if (transaction) {
        const newBalance = txType === TransactionType.ISSUE 
          ? currentBalance + txAmount 
          : currentBalance - txAmount;
        customerBalances.set(customer._id, newBalance);
        
        await LedgerModel.findOneAndUpdate(
          { tenantId: tenant._id, idempotencyKey: txIdempotencyKey, operationType: 'TRANSACTION' },
          {
            $set: {
              tenantId: tenant._id,
              customerId: customer._id,
              transactionId: transaction._id,
              amount: txType === TransactionType.ISSUE ? txAmount : -txAmount,
              balanceAfter: newBalance,
              idempotencyKey: txIdempotencyKey,
              operationType: 'TRANSACTION',
              createdAt: txDate,
            },
            $setOnInsert: {
              _id: uuidv4(),
            },
          },
          { upsert: true, new: true }
        ).exec().catch(() => null);
      }
    }
    
    console.log(`✅ Created ${additionalTxCount} additional mixed transactions`);

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
