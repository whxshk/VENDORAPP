import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { LoyaltyLedgerEntry, LoyaltyLedgerEntrySchema } from '../database/schemas/LoyaltyLedgerEntry.schema';
import { CustomerMerchantAccount, CustomerMerchantAccountSchema } from '../database/schemas/CustomerMerchantAccount.schema';
import { User, UserSchema } from '../database/schemas/User.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoyaltyLedgerEntry.name, schema: LoyaltyLedgerEntrySchema },
      { name: CustomerMerchantAccount.name, schema: CustomerMerchantAccountSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
