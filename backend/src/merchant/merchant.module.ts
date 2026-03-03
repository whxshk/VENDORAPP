import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { Tenant, TenantSchema } from '../database/schemas/Tenant.schema';
import { Location, LocationSchema } from '../database/schemas/Location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Location.name, schema: LocationSchema },
    ]),
  ],
  controllers: [MerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
