import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { IssuePointsDto } from './dto/issue-points.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { IdempotencyKey } from '../common/decorators/idempotency-key.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @RequireScope('merchant:*')
  @ApiOperation({ summary: 'List all transactions' })
  async findAll(
    @TenantContext() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('customerId') customerId?: string,
    @Query('staffId') staffId?: string,
    @Query('locationId') locationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Map frontend type (earn/redeem) to backend type (ISSUE/REDEEM)
    let backendType: 'ISSUE' | 'REDEEM' | undefined;
    if (type === 'earn') backendType = 'ISSUE';
    else if (type === 'redeem') backendType = 'REDEEM';
    
    return this.transactionsService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type: backendType,
      customerId,
      staffId,
      locationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Post('issue')
  @RequireScope('scan:*')
  @ApiOperation({ summary: 'Issue points to customer (via QR scan)' })
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUID for idempotent requests', required: true })
  @ApiResponse({ status: 201, description: 'Points issued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient balance' })
  async issuePoints(
    @Body() dto: IssuePointsDto,
    @TenantContext() tenantId: string,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.transactionsService.issuePoints(
      tenantId,
      dto.customerId,
      dto.amount,
      dto.deviceId || null,
      idempotencyKey,
    );
  }

  @Post('redeem')
  @RequireScope('scan:*', 'customer:*')
  @ApiOperation({ summary: 'Redeem points for reward' })
  @ApiHeader({ name: 'Idempotency-Key', description: 'UUID for idempotent requests', required: true })
  @ApiResponse({ status: 201, description: 'Points redeemed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient points' })
  async redeemPoints(
    @Body() dto: RedeemPointsDto,
    @TenantContext() tenantId: string,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.transactionsService.redeemPoints(
      tenantId,
      dto.customerId,
      dto.rewardId,
      idempotencyKey,
    );
  }

  @Delete(':id')
  @RequireScope('merchant:*')
  @ApiOperation({ summary: 'Void a transaction (delete record and reverse balance)' })
  async voidTransaction(
    @Param('id') id: string,
    @TenantContext() tenantId: string,
  ) {
    return this.transactionsService.voidTransaction(tenantId, id);
  }
}
