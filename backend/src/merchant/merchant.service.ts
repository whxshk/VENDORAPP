import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { Location, LocationDocument } from '../database/schemas/Location.schema';
import { GeocodingService } from '../geocoding/geocoding.service';

export interface MerchantSettings {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  category?: string;
  address?: string;
  formattedAddress?: string;
  phone?: string;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
  /** 'resolved' | 'failed' | 'pending' | null */
  geocodingStatus?: string;
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
  category?: string;
  address?: string;
  phone?: string;
  openingHours?: string;
  /** Deprecated: coordinates are now derived automatically from address via geocoding */
  latitude?: number;
  /** Deprecated: coordinates are now derived automatically from address via geocoding */
  longitude?: number;
  pointsPerQar?: number;
  config?: Record<string, any>;
}

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    private readonly geocodingService: GeocodingService,
  ) {}

  async getSettings(tenantId: string): Promise<MerchantSettings> {
    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const locations = await this.locationModel.find({ tenantId }).exec();

    // Prefer GeoJSON coordinates (set by geocoding) over legacy flat fields
    const geoCoords = (tenant as any).location?.coordinates;
    const lat = geoCoords ? geoCoords[1] : (tenant.config?.latitude != null ? Number(tenant.config.latitude) : undefined);
    const lng = geoCoords ? geoCoords[0] : (tenant.config?.longitude != null ? Number(tenant.config.longitude) : undefined);

    return {
      id: tenant._id as string,
      name: tenant.name,
      description: tenant.config?.description || '',
      logoUrl: tenant.config?.logo_url || undefined,
      category: tenant.config?.category || undefined,
      address: tenant.config?.address || undefined,
      formattedAddress: tenant.config?.formatted_address || undefined,
      phone: tenant.config?.phone || undefined,
      openingHours: tenant.config?.opening_hours || undefined,
      latitude: lat,
      longitude: lng,
      geocodingStatus: tenant.config?.geocoding_status || null,
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

    if (dto.category !== undefined) {
      updateData['config.category'] = dto.category;
    }

    if (dto.address !== undefined) {
      updateData['config.address'] = dto.address;

      // Auto-geocode whenever address is provided
      const currentAddress = tenant.config?.address;
      const addressChanged = dto.address !== currentAddress;

      if (dto.address && (addressChanged || !(tenant as any).location)) {
        updateData['config.geocoding_status'] = 'pending';

        this.geocodingService.geocode(dto.address).then((geo) => {
          if (geo) {
            const geoUpdate: any = {
              'config.latitude': geo.latitude,
              'config.longitude': geo.longitude,
              'config.formatted_address': geo.formattedAddress,
              'config.geocoding_status': 'resolved',
              location: {
                type: 'Point',
                coordinates: [geo.longitude, geo.latitude],
              },
            };
            if (geo.placeId) geoUpdate['config.place_id'] = geo.placeId;

            this.tenantModel
              .updateOne({ _id: tenantId }, { $set: geoUpdate })
              .exec()
              .catch((err) =>
                this.logger.error(`Failed to persist geocode for ${tenantId}: ${err.message}`),
              );
          } else {
            this.tenantModel
              .updateOne({ _id: tenantId }, { $set: { 'config.geocoding_status': 'failed' } })
              .exec()
              .catch(() => {});
          }
        });
      } else if (!dto.address) {
        // Address cleared — remove GeoJSON point
        updateData['config.geocoding_status'] = null;
        updateData['config.formatted_address'] = null;
        (updateData as any).$unset = { location: '' };
      }
    }

    if (dto.phone !== undefined) {
      updateData['config.phone'] = dto.phone;
    }

    if (dto.openingHours !== undefined) {
      updateData['config.opening_hours'] = dto.openingHours;
    }

    // Legacy manual lat/lng — still accepted but geocoded address takes priority
    if (dto.latitude !== undefined && !dto.address) {
      updateData['config.latitude'] = dto.latitude;
      if (dto.longitude !== undefined) {
        updateData['config.longitude'] = dto.longitude;
        updateData['location'] = {
          type: 'Point',
          coordinates: [dto.longitude, dto.latitude],
        };
      }
    }

    if (dto.pointsPerQar !== undefined) {
      updateData['config.pointsPerQar'] = Number(dto.pointsPerQar);
    }

    if (dto.config) {
      updateData.config = { ...tenant.config, ...dto.config };
    }

    const mongoUpdate: any = { $set: updateData };
    if ((updateData as any).$unset) {
      mongoUpdate.$unset = (updateData as any).$unset;
      delete updateData.$unset;
    }
    await this.tenantModel.updateOne({ _id: tenantId }, mongoUpdate).exec();

    return this.getSettings(tenantId);
  }
}
