import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward, RewardDocument } from '../database/schemas/Reward.schema';
import { Redemption, RedemptionDocument, RedemptionStatus } from '../database/schemas/Redemption.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(Redemption.name) private redemptionModel: Model<RedemptionDocument>,
  ) {}

  async create(tenantId: string, data: any) {
    const pointsRequired = data.pointsCost || data.pointsRequired;
    
    const reward = new this.rewardModel({
      _id: uuidv4(),
      tenantId,
      name: data.name,
      description: data.description,
      pointsRequired: pointsRequired,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    const saved = await reward.save();
    
    // Map pointsRequired to pointsCost for frontend compatibility
    return {
      ...saved.toObject(),
      id: saved._id,
      pointsCost: Number(saved.pointsRequired),
    };
  }

  async findAll(tenantId: string) {
    const rewards = await this.rewardModel
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .exec();
    
    // Map pointsRequired to pointsCost for frontend compatibility
    return rewards.map(reward => ({
      ...reward.toObject(),
      id: reward._id,
      pointsCost: Number(reward.pointsRequired),
    }));
  }

  async findOne(tenantId: string, id: string) {
    const reward = await this.rewardModel.findOne({ _id: id, tenantId }).exec();

    if (!reward) {
      throw new NotFoundException(`Reward ${id} not found`);
    }

    // Map pointsRequired to pointsCost for frontend compatibility
    return {
      ...reward.toObject(),
      id: reward._id,
      pointsCost: Number(reward.pointsRequired),
    };
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);
    
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.pointsCost !== undefined || data.pointsRequired !== undefined) {
      updateData.pointsRequired = data.pointsCost || data.pointsRequired;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await this.rewardModel
      .findOneAndUpdate({ _id: id, tenantId }, updateData, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Reward ${id} not found`);
    }

    // Map pointsRequired to pointsCost for frontend compatibility
    return {
      ...updated.toObject(),
      id: updated._id,
      pointsCost: Number(updated.pointsRequired),
    };
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    
    // Check if reward has active redemptions
    const activeRedemptions = await this.redemptionModel.countDocuments({
      tenantId,
      rewardId: id,
      status: RedemptionStatus.COMPLETED,
    }).exec();

    if (activeRedemptions > 0) {
      throw new BadRequestException(
        `Cannot delete reward: It has ${activeRedemptions} completed redemption(s). Please deactivate it instead.`
      );
    }
    
    // Hard delete if no active redemptions
    await this.rewardModel.deleteOne({ _id: id, tenantId }).exec();
    return { id };
  }
}
