import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { ScanService } from './scan.service';
import { ScanApplyDto } from './dto/scan-apply.dto';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../common/decorators/idempotency-key.decorator';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('scans')
@Controller('scans')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post('apply')
  @RequireScope('scan:*', 'merchant:*')
  @ApiOperation({ summary: 'Apply scan (CHECKIN / PURCHASE / REDEEM) from QR payload' })
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUID required', required: true })
  @ApiResponse({ status: 201, description: 'Scan applied' })
  @ApiResponse({ status: 400, description: 'Invalid body or QR' })
  @ApiResponse({ status: 403, description: 'Tenant/user/customer disabled' })
  @ApiResponse({ status: 404, description: 'Customer/reward/device not found' })
  @ApiResponse({ status: 409, description: 'Check-in throttled' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async apply(
    @Body() dto: ScanApplyDto,
    @TenantContext() tenantId: string,
    @CurrentUser() user: { userId: string; tenantId: string },
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.scanService.apply(tenantId, user.userId, dto, idempotencyKey);
  }

  @Post('simulate')
  @RequireScope('merchant:*', 'scan:*')
  async simulate(
    @Body() body: { customerId: string; type: 'earn' | 'redeem'; amount?: number; rewardId?: string },
    @TenantContext() tenantId: string,
    @Req() request: FastifyRequest,
  ) {
    const idempotencyKey = (request.headers['idempotency-key'] as string) || uuidv4();
    return this.scanService.simulate(tenantId, body.customerId, body.type, body.amount, body.rewardId, idempotencyKey);
  }
}
