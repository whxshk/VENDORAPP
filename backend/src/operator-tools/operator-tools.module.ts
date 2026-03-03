import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatorToolsService } from './operator-tools.service';
import { OperatorToolsController } from './operator-tools.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { OutboxModule } from '../outbox/outbox.module';
import { AuditModule } from '../audit/audit.module';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountSchema } from '../database/schemas/CustomerMerchantAccount.schema';
import { Transaction, TransactionSchema } from '../database/schemas/Transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: CustomerMerchantAccount.name, schema: CustomerMerchantAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    LedgerModule,
    OutboxModule,
    AuditModule,
  ],
  controllers: [OperatorToolsController],
  providers: [OperatorToolsService],
  exports: [OperatorToolsService],
})
export class OperatorToolsModule {}
