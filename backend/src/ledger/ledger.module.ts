import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { LoyaltyLedgerEntry, LoyaltyLedgerEntrySchema } from '../database/schemas/LoyaltyLedgerEntry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoyaltyLedgerEntry.name, schema: LoyaltyLedgerEntrySchema },
    ]),
  ],
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
