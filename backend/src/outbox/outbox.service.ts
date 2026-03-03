import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { OutboxEvent, OutboxEventDocument, OutboxEventStatus } from '../database/schemas/OutboxEvent.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OutboxService {
  constructor(
    @InjectModel(OutboxEvent.name) private outboxModel: Model<OutboxEventDocument>,
  ) {}

  /**
   * Write event to outbox within a transaction
   * Must be called within a MongoDB session context
   */
  async writeEvent(
    tenantId: string,
    eventType: string,
    payload: Record<string, any>,
    session?: ClientSession,
  ): Promise<void> {
    const event = new this.outboxModel({
      _id: uuidv4(),
      tenantId,
      eventType,
      payload: payload,
      status: OutboxEventStatus.PENDING,
    });

    await event.save({ session });
  }
}
