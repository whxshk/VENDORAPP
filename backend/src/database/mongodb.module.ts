import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MongoDBService } from './mongodb.service';
import {
  Tenant,
  TenantSchema,
  Location,
  LocationSchema,
  User,
  UserSchema,
  Customer,
  CustomerSchema,
  CustomerMerchantAccount,
  CustomerMerchantAccountSchema,
  Transaction,
  TransactionSchema,
  LoyaltyLedgerEntry,
  LoyaltyLedgerEntrySchema,
  Reward,
  RewardSchema,
  Redemption,
  RedemptionSchema,
  Device,
  DeviceSchema,
  ScanEvent,
  ScanEventSchema,
  CustomerBalance,
  CustomerBalanceSchema,
  TransactionSummary,
  TransactionSummarySchema,
  Ruleset,
  RulesetSchema,
  AuditLog,
  AuditLogSchema,
  OutboxEvent,
  OutboxEventSchema,
  PilotDailyMetric,
  PilotDailyMetricSchema,
  PilotOnboardingFunnel,
  PilotOnboardingFunnelSchema,
  PilotCustomerActivity,
  PilotCustomerActivitySchema,
  PilotRewardUsage,
  PilotRewardUsageSchema,
} from './schemas';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined in environment variables');
        }
        // Ensure database name is included
        const url = databaseUrl.endsWith('/') 
          ? `${databaseUrl}sharkband?retryWrites=true&w=majority`
          : databaseUrl.includes('?') 
            ? databaseUrl 
            : `${databaseUrl}/sharkband?retryWrites=true&w=majority`;
        return {
          uri: url,
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Location.name, schema: LocationSchema },
      { name: User.name, schema: UserSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerMerchantAccount.name, schema: CustomerMerchantAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: LoyaltyLedgerEntry.name, schema: LoyaltyLedgerEntrySchema },
      { name: Reward.name, schema: RewardSchema },
      { name: Redemption.name, schema: RedemptionSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: ScanEvent.name, schema: ScanEventSchema },
      { name: CustomerBalance.name, schema: CustomerBalanceSchema },
      { name: TransactionSummary.name, schema: TransactionSummarySchema },
      { name: Ruleset.name, schema: RulesetSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: OutboxEvent.name, schema: OutboxEventSchema },
      { name: PilotDailyMetric.name, schema: PilotDailyMetricSchema },
      { name: PilotOnboardingFunnel.name, schema: PilotOnboardingFunnelSchema },
      { name: PilotCustomerActivity.name, schema: PilotCustomerActivitySchema },
      { name: PilotRewardUsage.name, schema: PilotRewardUsageSchema },
    ]),
  ],
  providers: [MongoDBService],
  exports: [MongoDBService, MongooseModule],
})
export class MongoDBModule {}
