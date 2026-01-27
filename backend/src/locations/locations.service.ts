import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from '../database/schemas/Location.schema';
import { v4 as uuidv4 } from 'uuid';

export interface CreateLocationDto {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

@Injectable()
export class LocationsService {
  constructor(@InjectModel(Location.name) private locationModel: Model<LocationDocument>) {}

  async findAll(tenantId: string) {
    return this.locationModel.find({ tenantId }).exec();
  }

  async create(tenantId: string, dto: CreateLocationDto) {
    const location = new this.locationModel({
      _id: uuidv4(),
      tenantId,
      name: dto.name,
      address: dto.address || undefined,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return location.save();
  }
}
