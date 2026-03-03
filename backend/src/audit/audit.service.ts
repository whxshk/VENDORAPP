import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../database/schemas/AuditLog.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>) {}

  async log(
    tenantId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: any,
    session?: ClientSession,
  ) {
    const auditLog = new this.auditModel({
      _id: uuidv4(),
      tenantId,
      userId,
      action,
      resourceType,
      resourceId,
      metadata: metadata || {},
    });
    return auditLog.save({ session });
  }
}
