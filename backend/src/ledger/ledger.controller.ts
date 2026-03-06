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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomerMerchantAccount, CustomerMerchantAccountDocument } from '../database/schemas/CustomerMerchantAccount.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Customers register under the platform tenant; their accounts are per-merchant
const PLATFORM_TENANT_ID = 'sharkband-platform';

@ApiTags('ledger')
@Controller('ledger')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
    @InjectModel(CustomerMerchantAccount.name) private accountModel: Model<CustomerMerchantAccountDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
    // Platform customers have entries across all merchant tenants — pass null to sum all
    const effectiveTenantId = tenantId === PLATFORM_TENANT_ID ? null : tenantId;
    const balance = await this.ledgerService.getBalance(effectiveTenantId, resolved);
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
    // Platform customers have entries across all merchant tenants — pass null to fetch all
    const effectiveTenantId = tenantId === PLATFORM_TENANT_ID ? null : tenantId;
    return this.ledgerService.getLedgerHistory(effectiveTenantId, resolved, p, l);
  }

  private async resolveCustomerId(
    tenantId: string,
    userId: string,
    customerId: string,
  ): Promise<string> {
    if (!customerId || !customerId.trim()) {
      throw new BadRequestException('customerId is required');
    }
    // Platform customers are registered under 'sharkband-platform' but their
    // CustomerMerchantAccount records live under each merchant's tenantId.
    // For platform callers, verify the customerId exists in ANY merchant account.
    const accountQuery: any =
      tenantId === PLATFORM_TENANT_ID
        ? { customerId: customerId.trim() }
        : { tenantId, customerId: customerId.trim() };

    const account = await this.accountModel.findOne(accountQuery).exec();
    if (!account) {
      throw new ForbiddenException('Customer not found or access denied');
    }

    // Ownership check: customers can only access their own data
    const dbUser = await this.userModel
      .findOne({ _id: userId })
      .select('customerId')
      .exec();
    if (dbUser?.customerId && dbUser.customerId !== customerId.trim()) {
      throw new ForbiddenException('Customers can only access their own ledger');
    }
    return customerId.trim();
  }
}
