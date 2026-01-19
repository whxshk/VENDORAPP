/**
 * Enhanced seed script for demo/pilot tenants with realistic data
 * Run with: npm run seed
 * 
 * This script uses upsert operations to be idempotent - safe to run multiple times
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CUSTOMER_DATA } from '../common/customer-data';

const prisma = new PrismaClient();

// Helper function to convert Prisma Decimal to number
function toNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return typeof value === 'number' ? value : Number(value);
}

async function main() {
  console.log('🌱 Seeding database with realistic data...\n');

  try {
    // Create demo tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {
        name: 'Arabian Coffee House',
        config: {
          pointsPerQAR: 0.5,
          currency: 'QAR',
        },
      },
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Arabian Coffee House',
        config: {
          pointsPerQAR: 0.5,
          currency: 'QAR',
        },
      },
    });

    console.log(`✅ Created/Updated tenant: ${tenant.name}`);

    // Create multiple locations
    const locations = await Promise.all([
      prisma.location.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000002',
          tenantId: tenant.id,
          name: 'The Pearl Branch',
          address: 'The Pearl-Qatar, Doha',
          isActive: true,
        },
      }),
      prisma.location.upsert({
        where: { id: '00000000-0000-0000-0000-000000000003' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000003',
          tenantId: tenant.id,
          name: 'City Center Branch',
          address: 'City Center Doha, West Bay',
          isActive: true,
        },
      }),
      prisma.location.upsert({
        where: { id: '00000000-0000-0000-0000-000000000004' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000004',
          tenantId: tenant.id,
          name: 'Villaggio Branch',
          address: 'Villaggio Mall, Doha',
          isActive: true,
        },
      }),
    ]);

    console.log(`✅ Created/Updated ${locations.length} locations`);

    // Create admin user
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const adminUser = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: 'admin@coffee.com',
        },
      },
      update: {
        hashedPassword,
        roles: ['MERCHANT_ADMIN'],
        scopes: ['merchant:*'],
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        email: 'admin@coffee.com',
        hashedPassword,
        roles: ['MERCHANT_ADMIN'],
        scopes: ['merchant:*'],
        isActive: true,
      },
    });

    console.log(`✅ Created/Updated admin user: ${adminUser.email}`);

    // Create staff users
    const staffPasswords = ['staff123456', 'cashier123', 'manager123'];
    const staffData = [
      { email: 'ahmed@coffee.com', name: 'Ahmed Ali', role: 'MANAGER' },
      { email: 'fatima@coffee.com', name: 'Fatima Hassan', role: 'CASHIER' },
      { email: 'mohammed@coffee.com', name: 'Mohammed Salim', role: 'CASHIER' },
    ];

    const staffUsers = await Promise.all(
      staffData.map(async (staff, index) => {
        const hashed = await bcrypt.hash(staffPasswords[index], 10);
        return prisma.user.upsert({
          where: {
            tenantId_email: {
              tenantId: tenant.id,
              email: staff.email,
            },
          },
          update: {
            hashedPassword: hashed,
            roles: [staff.role],
            scopes: ['scan:*'],
            isActive: true,
          },
          create: {
            tenantId: tenant.id,
            email: staff.email,
            hashedPassword: hashed,
            roles: [staff.role],
            scopes: ['scan:*'],
            isActive: true,
          },
        });
      })
    );

    console.log(`✅ Created/Updated ${staffUsers.length} staff users`);

    // Create devices for each location
    const deviceIdentifiers = [
      'POS-THE-1',
      'POS-CIT-1',
      'POS-VIL-1',
    ];

    const devices = await Promise.all(
      locations.map((location, index) =>
        prisma.device.upsert({
          where: {
            tenantId_deviceIdentifier: {
              tenantId: tenant.id,
              deviceIdentifier: deviceIdentifiers[index],
            },
          },
          update: {
            locationId: location.id,
            isActive: true,
          },
          create: {
            tenantId: tenant.id,
            locationId: location.id,
            deviceIdentifier: deviceIdentifiers[index],
            registeredByUserId: adminUser.id,
            isActive: true,
          },
        })
      )
    );

    console.log(`✅ Created/Updated ${devices.length} devices`);

    // Create customers with QR token secrets and store metadata in first transaction
    // Clear existing customers first to avoid duplicates on reseed
    await prisma.customerMerchantAccount.deleteMany({
      where: { tenantId: tenant.id },
    });
    await prisma.customerBalance.deleteMany({
      where: { tenantId: tenant.id },
    });
    
    // Create customers with real data
    const customers = await Promise.all(
      CUSTOMER_DATA.map(async (customerInfo) => {
        // Generate a unique QR token secret for each customer
        const qrTokenSecret = crypto.randomBytes(32).toString('hex');
        return prisma.customer.create({
          data: {
            qrTokenSecret,
            rotationIntervalSec: 30,
          },
        });
      })
    );


    console.log(`✅ Created ${customers.length} customers`);

    // Create customer-merchant accounts and balances
    // Generate balance amounts for all 25 customers
    const balanceAmounts = Array.from({ length: CUSTOMER_DATA.length }, (_, i) => {
      if (i < 12) {
        // First 12 get varied balances
        return [0, 25, 50, 75, 100, 125, 150, 200, 250, 300, 350, 450][i] || 0;
      } else if (i < 20) {
        // Next 8 get moderate balances
        return [100, 150, 200, 75, 250, 300, 175, 400][i - 12] || 0;
      } else {
        // Last 5 get lower or zero balances
        return [50, 125, 0, 200, 75][i - 20] || 0;
      }
    });

    const customerAccounts = await Promise.all(
      customers.map((customer, index) =>
        prisma.customerMerchantAccount.upsert({
          where: {
            customerId_tenantId: {
              customerId: customer.id,
              tenantId: tenant.id,
            },
          },
          update: {
            membershipStatus: index < 20 ? 'ACTIVE' : 'INACTIVE',
          },
          create: {
            customerId: customer.id,
            tenantId: tenant.id,
            membershipStatus: index < 20 ? 'ACTIVE' : 'INACTIVE',
          },
        })
      )
    );

    console.log(`✅ Created/Updated ${customerAccounts.length} customer accounts`);

    // Create customer balances (points earned)
    await Promise.all(
      customers.map((customer, index) =>
        prisma.customerBalance.upsert({
          where: {
            tenantId_customerId: {
              tenantId: tenant.id,
              customerId: customer.id,
            },
          },
          update: {
            balance: balanceAmounts[index],
          },
          create: {
            tenantId: tenant.id,
            customerId: customer.id,
            balance: balanceAmounts[index],
          },
        })
      )
    );

    console.log(`✅ Created/Updated customer balances`);

    // Create rewards
    const rewardsData = [
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Free Coffee',
        pointsRequired: 100,
        description: 'Redeem for one free coffee of any size',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'Free Pastry',
        pointsRequired: 75,
        description: 'Redeem for one free pastry from our selection',
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        name: '10% Discount',
        pointsRequired: 50,
        description: 'Get 10% off your next purchase',
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        name: 'Free Cappuccino',
        pointsRequired: 120,
        description: 'Redeem for one free cappuccino',
      },
      {
        id: '00000000-0000-0000-0000-000000000007',
        name: 'Buy 1 Get 1 Free',
        pointsRequired: 150,
        description: 'Buy one coffee, get one free',
      },
      {
        id: '00000000-0000-0000-0000-000000000008',
        name: 'Free Meal Combo',
        pointsRequired: 300,
        description: 'Redeem for a free coffee and pastry combo',
      },
    ];

    const rewards = await Promise.all(
      rewardsData.map((reward) =>
        prisma.reward.upsert({
          where: { id: reward.id },
          update: {
            name: reward.name,
            pointsRequired: reward.pointsRequired,
            description: reward.description,
            isActive: true,
          },
          create: {
            id: reward.id,
            tenantId: tenant.id,
            name: reward.name,
            pointsRequired: reward.pointsRequired,
            description: reward.description,
            isActive: true,
          },
        })
      )
    );

    console.log(`✅ Created/Updated ${rewards.length} rewards`);

    // Clear existing transactions and related data for clean reseed
    await prisma.loyaltyLedgerEntry.deleteMany({
      where: { tenantId: tenant.id },
    });
    await prisma.redemption.deleteMany({
      where: { tenantId: tenant.id },
    });
    await prisma.transaction.deleteMany({
      where: { tenantId: tenant.id },
    });

    console.log(`✅ Cleared existing transactions for clean reseed`);

    // Create welcome transactions for ALL customers to store their metadata
    // This must happen after clearing transactions
    await Promise.all(
      customers.map((customer, index) => {
        const customerInfo = CUSTOMER_DATA[index];
        const welcomeIdempotencyKey = `welcome-${customer.id}-${tenant.id}`;
        
        // Create a welcome transaction with 0 points to store customer metadata
        return prisma.transaction.create({
          data: {
            tenantId: tenant.id,
            customerId: customer.id,
            type: 'ISSUE',
            amount: 0,
            status: 'COMPLETED',
            idempotencyKey: welcomeIdempotencyKey,
            deviceId: devices[0].id,
            metadata: {
              customerName: customerInfo.name,
              customerEmail: customerInfo.email,
              customerPhone: customerInfo.phone,
              isWelcomeTransaction: true,
            },
            createdAt: new Date(customerInfo.joinDate),
          },
        }).catch(() => {
          // Ignore errors if welcome transaction already exists
        });
      })
    );

    console.log(`✅ Created welcome transactions with customer metadata`);

    // Create some sample transactions for active customers
    const transactionDates = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      transactionDates.push(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    }

    const transactions = [];

    // Create ISSUE transactions (earn points) - use all active customers
    const activeCustomers = customers.slice(0, 20); // First 20 are active
    for (let i = 0; i < 30; i++) {
      const customer = activeCustomers[i % activeCustomers.length]!;
      const date = transactionDates[i % 30];
      const amount = Math.floor(Math.random() * 150 + 50); // 50-200 QAR
      const points = Math.floor(amount * 0.5); // 0.5 points per QAR

      const idempotencyKey = crypto.randomUUID();

      const customerIndex = customers.findIndex((c) => c.id === customer.id);
      const customerInfo = CUSTOMER_DATA[customerIndex % CUSTOMER_DATA.length];
      const transaction = await prisma.transaction.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          type: 'ISSUE',
          amount,
          status: 'COMPLETED',
          idempotencyKey,
          deviceId: devices[i % devices.length].id,
          metadata: {
            purchaseAmount: amount,
            pointsEarned: points,
            customerName: customerInfo?.name,
            customerEmail: customerInfo?.email,
            customerPhone: customerInfo?.phone,
          },
          createdAt: date,
        },
      });

      transactions.push(transaction);

      // Get current balance before this transaction
      const balanceBefore = await prisma.customerBalance.findUnique({
        where: {
          tenantId_customerId: {
            tenantId: tenant.id,
            customerId: customer.id,
          },
        },
      });

      const currentBalance = toNumber(balanceBefore?.balance);
      const balanceAfter = currentBalance + points;

      // Create ledger entry
      await prisma.loyaltyLedgerEntry.create({
        data: {
          tenantId: tenant.id,
          transactionId: transaction.id,
          customerId: customer.id,
          amount: points,
          balanceAfter,
          idempotencyKey: transaction.idempotencyKey,
          operationType: 'ISSUE',
          createdAt: date,
        },
      });

      // Update customer balance
      await prisma.customerBalance.update({
        where: {
          tenantId_customerId: {
            tenantId: tenant.id,
            customerId: customer.id,
          },
        },
        data: {
          balance: balanceAfter,
          lastUpdatedAt: date,
        },
      });
    }

    // Create REDEEM transactions (spend points)
    const redeemCount = 8;
    for (let i = 0; i < redeemCount; i++) {
      const customer = customers[i % 8]!; // Use customers with points
      const reward = rewards[i % rewards.length];
      const date = transactionDates[25 + (i % 5)];
      
      // Check if customer has enough points
      const balance = await prisma.customerBalance.findUnique({
        where: {
          tenantId_customerId: {
            tenantId: tenant.id,
            customerId: customer.id,
          },
        },
      });

      const currentBalance = toNumber(balance?.balance);
      const pointsRequired = toNumber(reward.pointsRequired);

      if (currentBalance >= pointsRequired) {
        const idempotencyKey = crypto.randomUUID();

        const customerIndex = customers.findIndex((c) => c.id === customer.id);
      const customerInfo = CUSTOMER_DATA[customerIndex % CUSTOMER_DATA.length];
        const transaction = await prisma.transaction.create({
          data: {
            tenantId: tenant.id,
            customerId: customer.id,
            type: 'REDEEM',
            amount: reward.pointsRequired,
            status: 'COMPLETED',
            idempotencyKey,
            deviceId: devices[i % devices.length].id,
            metadata: {
              rewardId: reward.id,
              rewardName: reward.name,
              customerName: customerInfo?.name,
              customerEmail: customerInfo?.email,
              customerPhone: customerInfo?.phone,
            },
            createdAt: date,
          },
        });

        const balanceAfter = currentBalance - pointsRequired;

        // Create ledger entry
        await prisma.loyaltyLedgerEntry.create({
          data: {
            tenantId: tenant.id,
            transactionId: transaction.id,
            customerId: customer.id,
            amount: -pointsRequired,
            balanceAfter,
            idempotencyKey: transaction.idempotencyKey,
            operationType: 'REDEEM',
            createdAt: date,
          },
        });

        // Update customer balance
        await prisma.customerBalance.update({
          where: {
            tenantId_customerId: {
              tenantId: tenant.id,
              customerId: customer.id,
            },
          },
          data: {
            balance: balanceAfter,
            lastUpdatedAt: date,
          },
        });

        // Create redemption record
        await prisma.redemption.upsert({
          where: {
            tenantId_idempotencyKey: {
              tenantId: tenant.id,
              idempotencyKey: transaction.idempotencyKey,
            },
          },
          update: {
            status: 'COMPLETED',
            completedAt: date,
          },
          create: {
            tenantId: tenant.id,
            customerId: customer.id,
            rewardId: reward.id,
            pointsDeducted: reward.pointsRequired,
            status: 'COMPLETED',
            idempotencyKey: transaction.idempotencyKey,
            completedAt: date,
          },
        });

        transactions.push(transaction);
      }
    }

    console.log(`✅ Created ${transactions.length} transactions`);
    console.log(`✅ Created ledger entries`);

    console.log('\n✅ Seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`  - 1 Tenant: ${tenant.name}`);
    console.log(`  - ${locations.length} Locations`);
    console.log(`  - ${1 + staffUsers.length} Users (1 admin + ${staffUsers.length} staff)`);
    console.log(`  - ${devices.length} Devices`);
    console.log(`  - ${customers.length} Customers`);
    console.log(`  - ${rewards.length} Rewards`);
    console.log(`  - ${transactions.length} Transactions`);
    console.log('\n🔑 Login Credentials:');
    console.log('  Admin: admin@coffee.com / demo123456');
    console.log('  Manager: ahmed@coffee.com / staff123456');
    console.log('  Cashier: fatima@coffee.com / cashier123');
    console.log('  Cashier: mohammed@coffee.com / manager123');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
