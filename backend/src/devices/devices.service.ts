import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../database/schemas/Device.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelDocument } from '../database/schemas/PilotOnboardingFunnel.schema';
import { PilotMetricsService } from '../pilot-metrics/pilot-metrics.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(PilotOnboardingFunnel.name) private funnelModel: Model<PilotOnboardingFunnelDocument>,
    private pilotMetricsService: PilotMetricsService,
  ) {}

  async register(tenantId: string, data: any) {
    const device = new this.deviceModel({
      _id: uuidv4(),
      ...data,
      tenantId,
    });
    const savedDevice = await device.save();
    
    // Track onboarding milestone (first device only)
    const funnel = await this.funnelModel.findOne({ tenantId }).exec();
    if (!funnel?.firstDeviceRegisteredAt) {
      await this.pilotMetricsService.trackOnboardingMilestone(tenantId, 'first_device');
    }
    
    return savedDevice;
  }

  async findAll(tenantId: string) {
    return this.deviceModel.find({ tenantId }).exec();
  }
}
