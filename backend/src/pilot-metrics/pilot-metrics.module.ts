import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PilotMetricsService } from './pilot-metrics.service';
import { PilotDailyMetric, PilotDailyMetricSchema } from '../database/schemas/PilotDailyMetric.schema';
import { PilotCustomerActivity, PilotCustomerActivitySchema } from '../database/schemas/PilotCustomerActivity.schema';
import { PilotRewardUsage, PilotRewardUsageSchema } from '../database/schemas/PilotRewardUsage.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelSchema } from '../database/schemas/PilotOnboardingFunnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PilotDailyMetric.name, schema: PilotDailyMetricSchema },
      { name: PilotCustomerActivity.name, schema: PilotCustomerActivitySchema },
      { name: PilotRewardUsage.name, schema: PilotRewardUsageSchema },
      { name: PilotOnboardingFunnel.name, schema: PilotOnboardingFunnelSchema },
    ]),
  ],
  providers: [PilotMetricsService],
  exports: [PilotMetricsService],
})
export class PilotMetricsModule {}
