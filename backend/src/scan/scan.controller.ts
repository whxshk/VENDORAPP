import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { ScanService } from './scan.service';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('scan')
@Controller('scan')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post('simulate')
  @RequireScope('merchant:*', 'scan:*')
  async simulate(
    @Body() body: { customerId: string; type: 'earn' | 'redeem'; amount?: number; rewardId?: string },
    @TenantContext() tenantId: string,
    @Req() request: FastifyRequest,
  ) {
    // Get idempotency key from header or generate one
    const idempotencyKey = (request.headers['idempotency-key'] as string) || uuidv4();
    return this.scanService.simulate(tenantId, body.customerId, body.type, body.amount, body.rewardId, idempotencyKey);
  }
}
