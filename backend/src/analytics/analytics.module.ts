import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PilotReportsService } from './pilot-reports.service';
import { Transaction, TransactionSchema } from '../database/schemas/Transaction.schema';
import { Device, DeviceSchema } from '../database/schemas/Device.schema';
import { ScanEvent, ScanEventSchema } from '../database/schemas/ScanEvent.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { PilotDailyMetric, PilotDailyMetricSchema } from '../database/schemas/PilotDailyMetric.schema';
import { PilotRewardUsage, PilotRewardUsageSchema } from '../database/schemas/PilotRewardUsage.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelSchema } from '../database/schemas/PilotOnboardingFunnel.schema';
import { Reward, RewardSchema } from '../database/schemas/Reward.schema';
import { Redemption, RedemptionSchema } from '../database/schemas/Redemption.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: ScanEvent.name, schema: ScanEventSchema },
      { name: User.name, schema: UserSchema },
      { name: PilotDailyMetric.name, schema: PilotDailyMetricSchema },
      { name: PilotRewardUsage.name, schema: PilotRewardUsageSchema },
      { name: PilotOnboardingFunnel.name, schema: PilotOnboardingFunnelSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: Redemption.name, schema: RedemptionSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PilotReportsService],
  exports: [PilotReportsService],
})
export class AnalyticsModule {}
