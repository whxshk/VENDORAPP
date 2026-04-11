import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatorToolsService } from './operator-tools.service';
import { OperatorToolsController } from './operator-tools.controller';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';
import { LedgerModule } from '../ledger/ledger.module';
import { OutboxModule } from '../outbox/outbox.module';
import { AuditModule } from '../audit/audit.module';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { Customer, CustomerSchema } from '../database/schemas/Customer.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountSchema } from '../database/schemas/CustomerMerchantAccount.schema';
import { Transaction, TransactionSchema } from '../database/schemas/Transaction.schema';
import { AuditLog, AuditLogSchema } from '../database/schemas/AuditLog.schema';
import { LoyaltyLedgerEntry, LoyaltyLedgerEntrySchema } from '../database/schemas/LoyaltyLedgerEntry.schema';
import { Location, LocationSchema } from '../database/schemas/Location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerMerchantAccount.name, schema: CustomerMerchantAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: LoyaltyLedgerEntry.name, schema: LoyaltyLedgerEntrySchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    LedgerModule,
    OutboxModule,
    AuditModule,
  ],
  controllers: [OperatorToolsController, PlatformAdminController],
  providers: [OperatorToolsService, PlatformAdminService],
  exports: [OperatorToolsService, PlatformAdminService],
})
export class OperatorToolsModule {}
