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
  role: 'MERCHANT_ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF';
  locationId?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
    const scopes = dto.role === 'MERCHANT_ADMIN' ? ['merchant:*'] : ['scan:*'];

    // Create user
    const user = new this.userModel({
      _id: uuidv4(),
      tenantId,
      email: dto.email,
      hashedPassword,
      roles: [dto.role],
      scopes,
      isActive: true,
    });

    return user.save();
  }
}
