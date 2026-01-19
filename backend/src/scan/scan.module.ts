import { Module } from '@nestjs/common';
import { ScanController } from './scan.controller';
import { ScanService } from './scan.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { CustomersModule } from '../customers/customers.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [TransactionsModule, CustomersModule, PrismaModule],
  controllers: [ScanController],
  providers: [ScanService],
})
export class ScanModule {}
