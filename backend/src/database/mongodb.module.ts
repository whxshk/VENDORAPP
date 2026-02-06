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
        const databaseUrl = configService.get<string>('app.database.url') 
          || process.env.DATABASE_URL 
          || 'mongodb://localhost:27017/Waddy';
        
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not defined in environment variables');
        }
        // Ensure database name is included
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
        
        let url = databaseUrl;
        if (!hasDatabaseName) {
          // No database name specified - append it
          if (urlWithoutQuery.endsWith('/')) {
            // URL ends with / - append database name
            url = hasQueryParams
              ? `${urlWithoutQuery}Waddy?${databaseUrl.substring(queryIndex + 1)}`
              : `${urlWithoutQuery}Waddy?retryWrites=true&w=majority`;
          } else {
            // URL doesn't end with / - append /database
            url = hasQueryParams
              ? `${urlWithoutQuery}/Waddy?${databaseUrl.substring(queryIndex + 1)}`
              : `${urlWithoutQuery}/Waddy?retryWrites=true&w=majority`;
          }
        } else if (!hasQueryParams) {
          // Has database name but no query params - add them
          url = `${databaseUrl}?retryWrites=true&w=majority`;
        }
        // If database name exists and query params exist, use as-is
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
