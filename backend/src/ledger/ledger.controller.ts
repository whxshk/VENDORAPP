import {
  Controller,
  Get,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto';
import { WalletHistoryResponseDto } from './dto/wallet-history-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ledger')
@Controller('ledger')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('balance')
  @RequireScope('merchant:*', 'customer:*')
  @ApiOperation({ summary: 'Get customer wallet balance' })
  @ApiResponse({ status: 200, type: WalletBalanceResponseDto })
  async getBalance(
    @Query('customerId') customerId: string,
    @TenantContext() tenantId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<WalletBalanceResponseDto> {
    const resolved = await this.resolveCustomerId(tenantId, user.userId, customerId);
    const balance = await this.ledgerService.getBalance(tenantId, resolved);
    return { balance };
  }

  @Get('history')
  @RequireScope('merchant:*', 'customer:*')
  @ApiOperation({ summary: 'Get customer transaction history' })
  @ApiResponse({ status: 200, type: WalletHistoryResponseDto })
  async getHistory(
    @TenantContext() tenantId: string,
    @CurrentUser() user: { userId: string },
    @Query('customerId') customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<WalletHistoryResponseDto> {
    const resolved = await this.resolveCustomerId(tenantId, user.userId, customerId);
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? Math.min(parseInt(limit, 10) || 20, 100) : 20;
    return this.ledgerService.getLedgerHistory(tenantId, resolved, p, l);
  }

  private async resolveCustomerId(
    tenantId: string,
    userId: string,
    customerId: string,
  ): Promise<string> {
    if (!customerId || !customerId.trim()) {
      throw new BadRequestException('customerId is required');
    }
    const account = await this.prisma.customerMerchantAccount.findFirst({
      where: { tenantId, customerId: customerId.trim() },
    });
    if (!account) {
      throw new ForbiddenException('Customer not found or access denied');
    }
    const dbUser = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { customerId: true },
    });
    if (dbUser?.customerId && dbUser.customerId !== customerId.trim()) {
      throw new ForbiddenException('Customers can only access their own ledger');
    }
    return customerId.trim();
  }
}
