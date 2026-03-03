import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/User.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface CreateStaffDto {
  name: string;
  email: string;
  password: string;
  role: 'MERCHANT_ADMIN' | 'MANAGER' | 'CASHIER' | 'JANITOR' | 'STAFF';
  locationId?: string;
}

export interface UpdateStaffDto {
  name?: string;
  email?: string;
  role?: 'MERCHANT_ADMIN' | 'MANAGER' | 'CASHIER' | 'JANITOR' | 'STAFF';
  password?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  private getScopesForRole(role: 'MERCHANT_ADMIN' | 'MANAGER' | 'CASHIER' | 'JANITOR' | 'STAFF') {
    if (role === 'MERCHANT_ADMIN') return ['merchant:*'];
    if (role === 'MANAGER') return ['merchant:read', 'scan:*'];
    return ['scan:*'];
  }

  async findAll(tenantId: string) {
    return this.userModel.find({ tenantId }).exec();
  }

  async create(tenantId: string, dto: CreateStaffDto) {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({
      tenantId,
      email: dto.email,
    }).exec();

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Validate password
    if (dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Determine scopes based on role
    const scopes = this.getScopesForRole(dto.role);

    // Create user
    const user = new this.userModel({
      _id: uuidv4(),
      tenantId,
      name: dto.name,
      email: dto.email,
      hashedPassword,
      roles: [dto.role],
      scopes,
      isActive: true,
    });

    return user.save();
  }

  async update(tenantId: string, userId: string, dto: UpdateStaffDto) {
    const user = await this.userModel.findOne({ _id: userId, tenantId }).exec();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updateData: any = {};

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName) {
        throw new BadRequestException('Name is required');
      }
      updateData.name = trimmedName;
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (!normalizedEmail) {
        throw new BadRequestException('Email is required');
      }

      if (normalizedEmail !== user.email) {
        const existingUser = await this.userModel.findOne({
          tenantId,
          email: normalizedEmail,
          _id: { $ne: userId },
        }).exec();

        if (existingUser) {
          throw new ConflictException('Email already registered');
        }
      }

      updateData.email = normalizedEmail;
    }

    if (dto.role) {
      updateData.roles = [dto.role];
      updateData.scopes = this.getScopesForRole(dto.role);
    }

    if (dto.password !== undefined && dto.password.trim() !== '') {
      const cleanPassword = dto.password.trim();
      if (cleanPassword.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters long');
      }
      updateData.hashedPassword = await bcrypt.hash(cleanPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return user;
    }

    const updated = await this.userModel.findOneAndUpdate(
      { _id: userId, tenantId },
      { $set: updateData },
      { new: true },
    ).exec();

    return updated || user;
  }
}
