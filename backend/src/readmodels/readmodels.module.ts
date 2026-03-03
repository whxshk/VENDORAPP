import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadmodelsService } from './readmodels.service';
import { ReadmodelsConsumer } from './readmodels.consumer';
import { LedgerModule } from '../ledger/ledger.module';
import { PilotMetricsModule } from '../pilot-metrics/pilot-metrics.module';
import { CustomerBalance, CustomerBalanceSchema } from '../database/schemas/CustomerBalance.schema';
import { TransactionSummary, TransactionSummarySchema } from '../database/schemas/TransactionSummary.schema';
import { Device, DeviceSchema } from '../database/schemas/Device.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerBalance.name, schema: CustomerBalanceSchema },
      { name: TransactionSummary.name, schema: TransactionSummarySchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
    LedgerModule,
    PilotMetricsModule,
  ],
  providers: [ReadmodelsService, ReadmodelsConsumer],
  exports: [ReadmodelsService],
})
export class ReadmodelsModule {}
