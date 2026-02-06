import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { CustomersModule } from '../customers/customers.module';
import { AuditModule } from '../audit/audit.module';
import { RulesetsModule } from '../rulesets/rulesets.module';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { Customer, CustomerSchema } from '../database/schemas/Customer.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountSchema } from '../database/schemas/CustomerMerchantAccount.schema';
import { ScanEvent, ScanEventSchema } from '../database/schemas/ScanEvent.schema';
import { Reward, RewardSchema } from '../database/schemas/Reward.schema';
import { Transaction, TransactionSchema } from '../database/schemas/Transaction.schema';
import { Location, LocationSchema } from '../database/schemas/Location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerMerchantAccount.name, schema: CustomerMerchantAccountSchema },
      { name: ScanEvent.name, schema: ScanEventSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    TransactionsModule,
    CustomersModule,
    AuditModule,
    RulesetsModule,
  ],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
