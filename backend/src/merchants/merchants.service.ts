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
    // Always exclude the internal platform tenant
    query['_id'] = { $ne: 'sharkband-platform' };
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

  /**
   * Returns merchants sorted by proximity to the given coordinates.
   * Uses MongoDB $near on the 2dsphere-indexed `location` field so results
   * are already distance-sorted by the database — no client-side sorting needed.
   *
   * @param lat  User latitude
   * @param lng  User longitude
   * @param radius  Max distance in metres (default 25 km)
   */
  async nearby(lat: number, lng: number, radius: number = 25000) {
    const tenants = await this.tenantModel
      .find({
        isActive: true,
        'config.excludeFromDiscover': { $ne: true },
        _id: { $ne: 'sharkband-platform' },
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radius,
          },
        },
      })
      .exec();

    return tenants.map((t) => {
      const dto = this.toDto(t);
      // Compute straight-line distance using the Haversine formula
      const coords = (t as any).location?.coordinates;
      if (coords) {
        dto.distance_meters = haversineMeters(lat, lng, coords[1], coords[0]);
      }
      return dto;
    });
  }

  private toDto(tenant: TenantDocument) {
    const config = (tenant.config as Record<string, any>) || {};

    // Prefer GeoJSON coordinates (geocoded) over legacy flat fields in config
    const geoCoords = (tenant as any).location?.coordinates;
    const latitude = geoCoords ? geoCoords[1] : (config['latitude'] ?? null);
    const longitude = geoCoords ? geoCoords[0] : (config['longitude'] ?? null);

    return {
      id: tenant._id,
      name: tenant.name,
      category: config['category'] ?? null,
      description: config['description'] ?? null,
      logo_url: config['logo_url'] ?? null,
      cover_image_url: config['cover_image_url'] ?? null,
      loyalty_type: config['loyalty_type'] ?? 'points',
      stamps_required: config['stamps_required'] ?? 10,
      address: config['formatted_address'] || config['address'] || null,
      phone: config['phone'] ?? null,
      opening_hours: config['opening_hours'] ?? null,
      latitude,
      longitude,
      geocoding_status: config['geocoding_status'] ?? null,
      is_active: tenant.isActive,
      distance_meters: null as number | null,
    };
  }
}

/** Haversine distance between two lat/lng pairs, in metres. */
function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
