import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenancyService } from './tenancy.service';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
  ],
  providers: [TenancyService],
  exports: [TenancyService],
})
export class TenancyModule {}
