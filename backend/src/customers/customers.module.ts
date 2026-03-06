import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { RulesetsModule } from '../rulesets/rulesets.module';
import { Customer, CustomerSchema } from '../database/schemas/Customer.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountSchema } from '../database/schemas/CustomerMerchantAccount.schema';
import { Transaction, TransactionSchema } from '../database/schemas/Transaction.schema';
import { LoyaltyLedgerEntry, LoyaltyLedgerEntrySchema } from '../database/schemas/LoyaltyLedgerEntry.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';
import { Reward, RewardSchema } from '../database/schemas/Reward.schema';
import { Redemption, RedemptionSchema } from '../database/schemas/Redemption.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerMerchantAccount.name, schema: CustomerMerchantAccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: LoyaltyLedgerEntry.name, schema: LoyaltyLedgerEntrySchema },
      { name: User.name, schema: UserSchema },
      { name: Tenant.name, schema: TenantSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: Redemption.name, schema: RedemptionSchema },
    ]),
    LedgerModule,
    RulesetsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
