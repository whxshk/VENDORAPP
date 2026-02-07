import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, NatsConnection, JSONCodec } from 'nats';
import { ReadmodelsService } from './readmodels.service';
import { LedgerService } from '../ledger/ledger.service';
import { PilotMetricsService } from '../pilot-metrics/pilot-metrics.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from '../database/schemas/Device.schema';

@Injectable()
export class ReadmodelsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReadmodelsConsumer.name);
  private nc: NatsConnection | null = null;
  private readonly jsonCodec = JSONCodec();

  constructor(
    private readmodelsService: ReadmodelsService,
    private ledgerService: LedgerService,
    private configService: ConfigService,
    private pilotMetricsService: PilotMetricsService,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async onModuleInit() {
    const natsUrl = this.configService.get<string>('app.nats.url') || 'nats://localhost:4222';

    try {
      this.nc = await connect({ servers: natsUrl });
      this.logger.log(`Read models consumer connected to NATS at ${natsUrl}`);

      // Subscribe to points.issued events
      const pointsIssuedSub = this.nc.subscribe('loyalty.points.issued');
      this.processPointsIssued(pointsIssuedSub);

      // Subscribe to points.redeemed events
      const pointsRedeemedSub = this.nc.subscribe('loyalty.points.redeemed');
      this.processPointsRedeemed(pointsRedeemedSub);

      this.logger.log('Read models consumer subscribed to events');
    } catch (error) {
      this.logger.error('Failed to connect to NATS for read models consumer', error);
    }
  }

  async onModuleDestroy() {
    if (this.nc) {
      await this.nc.close();
      this.logger.log('Read models consumer NATS connection closed');
    }
  }

  private async processPointsIssued(sub: any) {
    (async () => {
      for await (const msg of sub) {
        try {
          const data = this.jsonCodec.decode(msg.data) as any;
          const { tenantId, customerId, amount, transactionId, balanceAfter, transactionDate } =
            data;

          this.logger.debug(`Processing points.issued event: transaction ${transactionId}`);

          // Update customer balance read model
          await this.readmodelsService.updateCustomerBalance(
            tenantId,
            customerId,
            balanceAfter,
            transactionId,
          );

          // Create transaction summary
          const txDate = transactionDate ? new Date(transactionDate) : new Date();
          await this.readmodelsService.createTransactionSummary(
            tenantId,
            transactionId,
            customerId,
            amount,
            'ISSUE',
            txDate,
          );

          // Track pilot metrics
          const deviceId = data.deviceId || null;
          let locationId: string | null = null;
          if (deviceId) {
            const device = await this.deviceModel
              .findOne({ _id: deviceId })
              .select('locationId')
              .exec();
            locationId = device?.locationId || null;
          }
          await this.pilotMetricsService.trackCustomerActivity(tenantId, customerId, txDate);
          await this.pilotMetricsService.updateDailyMetrics(tenantId, locationId, txDate, {
            transactionsIssue: 1,
          });

          if (typeof msg.ack === 'function') {
            msg.ack();
          }
        } catch (error) {
          this.logger.error('Error processing points.issued event', error);
          // Don't ack on error (redelivery)
        }
      }
    })();
  }

  private async processPointsRedeemed(sub: any) {
    (async () => {
      for await (const msg of sub) {
        try {
          const data = this.jsonCodec.decode(msg.data) as any;
          const {
            tenantId,
            customerId,
            pointsDeducted,
            transactionId,
            balanceAfter,
            redemptionId,
          } = data;

          this.logger.debug(`Processing points.redeemed event: transaction ${transactionId}`);

          // Update customer balance read model
          await this.readmodelsService.updateCustomerBalance(
            tenantId,
            customerId,
            balanceAfter,
            transactionId,
          );

          // Create transaction summary
          const txDate = new Date();
          await this.readmodelsService.createTransactionSummary(
            tenantId,
            transactionId,
            customerId,
            -pointsDeducted,
            'REDEEM',
            txDate,
          );

          // Track pilot metrics
          const rewardId = data.rewardId;
          if (rewardId) {
            await this.pilotMetricsService.trackRewardUsage(tenantId, rewardId, txDate);
          }
          await this.pilotMetricsService.updateDailyMetrics(tenantId, null, txDate, {
            transactionsRedeem: 1,
          });

          if (typeof msg.ack === 'function') {
            msg.ack();
          }
        } catch (error) {
          this.logger.error('Error processing points.redeemed event', error);
          // Don't ack on error (redelivery)
        }
      }
    })();
  }
}
