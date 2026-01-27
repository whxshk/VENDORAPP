import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { OutboxModule } from '../outbox/outbox.module';
import { FraudSignalsModule } from '../fraud-signals/fraud-signals.module';
import { PilotMetricsModule } from '../pilot-metrics/pilot-metrics.module';
import { Transaction, TransactionSchema } from '../database/schemas/Transaction.schema';
import { Customer, CustomerSchema } from '../database/schemas/Customer.schema';
import { Device, DeviceSchema } from '../database/schemas/Device.schema';
import { Redemption, RedemptionSchema } from '../database/schemas/Redemption.schema';
import { Reward, RewardSchema } from '../database/schemas/Reward.schema';
import { ScanEvent, ScanEventSchema } from '../database/schemas/ScanEvent.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelSchema } from '../database/schemas/PilotOnboardingFunnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: Redemption.name, schema: RedemptionSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: ScanEvent.name, schema: ScanEventSchema },
      { name: User.name, schema: UserSchema },
      { name: PilotOnboardingFunnel.name, schema: PilotOnboardingFunnelSchema },
    ]),
    LedgerModule,
    OutboxModule,
    FraudSignalsModule,
    PilotMetricsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
