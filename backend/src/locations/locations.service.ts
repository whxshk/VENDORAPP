import { Injectable, NotFoundException } from '@nestjs/common';
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

export interface UpdateLocationDto {
  name?: string;
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

  async findOne(tenantId: string, id: string) {
    const location = await this.locationModel.findOne({ _id: id, tenantId }).exec();
    if (!location) {
      throw new NotFoundException(`Branch with ID "${id}" not found`);
    }
    return location;
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

  async update(tenantId: string, id: string, dto: UpdateLocationDto) {
    const location = await this.locationModel
      .findOneAndUpdate({ _id: id, tenantId }, { $set: dto }, { new: true })
      .exec();

    if (!location) {
      throw new NotFoundException(`Branch with ID "${id}" not found`);
    }

    return location;
  }

  async delete(tenantId: string, id: string) {
    const location = await this.locationModel.findOneAndDelete({ _id: id, tenantId }).exec();

    if (!location) {
      throw new NotFoundException(`Branch with ID "${id}" not found`);
    }

    return { success: true };
  }
}
