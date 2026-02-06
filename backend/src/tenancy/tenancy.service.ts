import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';

@Injectable()
export class TenancyService {
  constructor(@InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>) {}

  async validateTenant(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return true;
  }

  async getTenant(tenantId: string) {
    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return tenant;
  }
}
