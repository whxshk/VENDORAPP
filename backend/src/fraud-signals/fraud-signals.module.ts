import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FraudSignalsService } from './fraud-signals.service';
import { FraudSignalsController } from './fraud-signals.controller';
import { AuditLog, AuditLogSchema } from '../database/schemas/AuditLog.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    AuditModule,
  ],
  controllers: [FraudSignalsController],
  providers: [FraudSignalsService],
  exports: [FraudSignalsService],
})
export class FraudSignalsModule {}
