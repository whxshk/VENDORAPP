import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { AuditModule } from '../audit/audit.module';
import { PilotMetricsModule } from '../pilot-metrics/pilot-metrics.module';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';
import { Location, LocationSchema } from '../database/schemas/Location.schema';
import { User, UserSchema } from '../database/schemas/User.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelSchema } from '../database/schemas/PilotOnboardingFunnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Location.name, schema: LocationSchema },
      { name: User.name, schema: UserSchema },
      { name: PilotOnboardingFunnel.name, schema: PilotOnboardingFunnelSchema },
    ]),
    AuditModule,
    PilotMetricsModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
