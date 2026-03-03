import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { PilotMetricsModule } from '../pilot-metrics/pilot-metrics.module';
import { Device, DeviceSchema } from '../database/schemas/Device.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelSchema } from '../database/schemas/PilotOnboardingFunnel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Device.name, schema: DeviceSchema },
      { name: PilotOnboardingFunnel.name, schema: PilotOnboardingFunnelSchema },
    ]),
    PilotMetricsModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
