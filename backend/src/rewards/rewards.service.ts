import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: any) {
    // Map pointsCost to pointsRequired if needed
    const rewardData: any = {
      tenantId,
      name: data.name,
      description: data.description,
      pointsRequired: data.pointsCost || data.pointsRequired,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    
    const reward = await this.prisma.reward.create({
      data: rewardData,
    });

    // Map pointsRequired to pointsCost for frontend compatibility
    return {
      ...reward,
      pointsCost: Number(reward.pointsRequired),
    };
  }

  async findAll(tenantId: string) {
    const rewards = await this.prisma.reward.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Map pointsRequired to pointsCost for frontend compatibility
    return rewards.map(reward => ({
      ...reward,
      pointsCost: Number(reward.pointsRequired),
    }));
  }

  async findOne(tenantId: string, id: string) {
    const reward = await this.prisma.reward.findFirst({
      where: { id, tenantId },
    });

    if (!reward) {
      throw new NotFoundException(`Reward ${id} not found`);
    }

    // Map pointsRequired to pointsCost for frontend compatibility
    return {
      ...reward,
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

    const updated = await this.prisma.reward.update({
      where: { id },
      data: updateData,
    });

    // Map pointsRequired to pointsCost for frontend compatibility
    return {
      ...updated,
      pointsCost: Number(updated.pointsRequired),
    };
  }

  async delete(tenantId: string, id: string) {
    const reward = await this.findOne(tenantId, id);
    
    // Soft delete by setting isActive to false, or hard delete
    // For now, doing hard delete as requested
    return this.prisma.reward.delete({
      where: { id },
    });
  }
}
