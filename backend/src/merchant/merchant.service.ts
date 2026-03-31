import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { Location, LocationDocument } from '../database/schemas/Location.schema';

export interface MerchantSettings {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  pointsPerQar: number;
  config: Record<string, any>;
  branches: Array<{
    id: string;
    name: string;
    address?: string;
    isActive: boolean;
  }>;
}

export interface UpdateMerchantSettingsDto {
  name?: string;
  description?: string;
  logoUrl?: string;
  pointsPerQar?: number;
  config?: Record<string, any>;
}

@Injectable()
export class MerchantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  async getSettings(tenantId: string): Promise<MerchantSettings> {
    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const locations = await this.locationModel.find({ tenantId }).exec();

    return {
      id: tenant._id as string,
      name: tenant.name,
      description: tenant.config?.description || '',
      logoUrl: tenant.config?.logo_url || undefined,
      pointsPerQar: Number(tenant.config?.pointsPerQar ?? 1),
      config: tenant.config || {},
      branches: locations.map((loc) => ({
        id: loc._id as string,
        name: loc.name,
        address: loc.address,
        isActive: loc.isActive,
      })),
    };
  }

  async updateSettings(
    tenantId: string,
    dto: UpdateMerchantSettingsDto,
  ): Promise<MerchantSettings> {
    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Build update object
    const updateData: any = {};
    
    if (dto.name) {
      updateData.name = dto.name;
    }
    
    if (dto.description !== undefined) {
      updateData['config.description'] = dto.description;
    }

    if (dto.logoUrl !== undefined) {
      updateData['config.logo_url'] = dto.logoUrl;
    }

    if (dto.pointsPerQar !== undefined) {
      updateData['config.pointsPerQar'] = Number(dto.pointsPerQar);
    }

    if (dto.config) {
      updateData.config = { ...tenant.config, ...dto.config };
    }

    await this.tenantModel.updateOne({ _id: tenantId }, { $set: updateData }).exec();

    return this.getSettings(tenantId);
  }
}
