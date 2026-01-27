import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PilotReportsService } from './pilot-reports.service';
import { Transaction, TransactionSchema } from '../database/schemas/Transaction.schema';
import { Device, DeviceSchema } from '../database/schemas/Device.schema';
import { ScanEvent, ScanEventSchema } from '../database/schemas/ScanEvent.schema';
import { User, UserSchema } from '../database/schemas/User.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: ScanEvent.name, schema: ScanEventSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PilotReportsService],
  exports: [PilotReportsService],
})
export class AnalyticsModule {}
