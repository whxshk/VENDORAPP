import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async list(params?: { is_active?: boolean }) {
    const query: any = {};
    if (params?.is_active !== undefined) {
      query.isActive = params.is_active;
    } else {
      query.isActive = true;
    }
    // Exclude platform/test tenants that are flagged as hidden
    query['config.excludeFromDiscover'] = { $ne: true };
    const tenants = await this.tenantModel.find(query).sort({ name: 1 }).exec();
    return tenants.map((t) => this.toDto(t));
  }

  async getById(id: string) {
    const tenant = await this.tenantModel.findOne({ _id: id }).exec();
    if (!tenant) {
      throw new NotFoundException(`Merchant ${id} not found`);
    }
    return this.toDto(tenant);
  }

  private toDto(tenant: TenantDocument) {
    const config = (tenant.config as Record<string, any>) || {};
    return {
      id: tenant._id,
      name: tenant.name,
      category: config['category'] ?? null,
      description: config['description'] ?? null,
      logo_url: config['logo_url'] ?? null,
      cover_image_url: config['cover_image_url'] ?? null,
      loyalty_type: config['loyalty_type'] ?? 'points',
      stamps_required: config['stamps_required'] ?? 10,
      address: config['address'] ?? null,
      phone: config['phone'] ?? null,
      opening_hours: config['opening_hours'] ?? null,
      latitude: config['latitude'] ?? null,
      longitude: config['longitude'] ?? null,
      is_active: tenant.isActive,
    };
  }
}
