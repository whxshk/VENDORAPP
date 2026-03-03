import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward, RewardDocument } from '../database/schemas/Reward.schema';
import { Redemption, RedemptionDocument, RedemptionStatus } from '../database/schemas/Redemption.schema';
import { v4 as uuidv4 } from 'uuid';

function mapReward(reward: RewardDocument) {
  const obj = reward.toObject() as any;
  const rewardType = obj.rewardType || 'points';
  return {
    ...obj,
    id: reward._id,
    rewardType,
    pointsCost: rewardType === 'points' ? Number(obj.pointsRequired ?? 0) : undefined,
    stampsCost: rewardType === 'stamps' ? (obj.stampsCost ?? undefined) : undefined,
  };
}

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(Redemption.name) private redemptionModel: Model<RedemptionDocument>,
  ) {}

  async create(tenantId: string, data: any) {
    const rewardType = data.rewardType === 'stamps' ? 'stamps' : 'points';

    const doc: any = {
      _id: uuidv4(),
      tenantId,
      name: data.name,
      description: data.description,
      rewardType,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    if (rewardType === 'stamps') {
      doc.stampsCost = Number(data.stampsCost);
      doc.pointsRequired = 0; // satisfy legacy required constraint; stamps use stampsCost
    } else {
      doc.pointsRequired = data.pointsCost || data.pointsRequired;
    }

    const reward = new this.rewardModel(doc);
    const saved = await reward.save();
    return mapReward(saved);
  }

  async findAll(tenantId: string) {
    const rewards = await this.rewardModel
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .exec();
    return rewards.map(mapReward);
  }

  async findOne(tenantId: string, id: string) {
    const reward = await this.rewardModel.findOne({ _id: id, tenantId }).exec();
    if (!reward) {
      throw new NotFoundException(`Reward ${id} not found`);
    }
    return mapReward(reward);
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const rewardType = data.rewardType === 'stamps' ? 'stamps' : data.rewardType === 'points' ? 'points' : undefined;
    if (rewardType) {
      updateData.rewardType = rewardType;
      if (rewardType === 'stamps') {
        updateData.stampsCost = Number(data.stampsCost);
        updateData.pointsRequired = 0; // satisfy legacy required constraint
      } else {
        updateData.pointsRequired = data.pointsCost || data.pointsRequired;
        updateData.stampsCost = undefined;
      }
    } else {
      if (data.pointsCost !== undefined || data.pointsRequired !== undefined) {
        updateData.pointsRequired = data.pointsCost || data.pointsRequired;
      }
      if (data.stampsCost !== undefined) {
        updateData.stampsCost = Number(data.stampsCost);
      }
    }

    const updated = await this.rewardModel
      .findOneAndUpdate({ _id: id, tenantId }, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Reward ${id} not found`);
    }

    return mapReward(updated);
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

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

    await this.rewardModel.deleteOne({ _id: id, tenantId }).exec();
    return { id };
  }
}
