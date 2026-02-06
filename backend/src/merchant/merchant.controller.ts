import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MerchantService, UpdateMerchantSettingsDto } from './merchant.service';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('merchant')
@Controller('merchant')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get('settings')
  @RequireScope('merchant:*', 'scan:*')
  @ApiOperation({ summary: 'Get merchant settings' })
  @ApiResponse({ status: 200, description: 'Returns merchant settings including branches' })
  async getSettings(@TenantContext() tenantId: string) {
    return this.merchantService.getSettings(tenantId);
  }

  @Patch('settings')
  @RequireScope('merchant:*')
  @ApiOperation({ summary: 'Update merchant settings' })
  @ApiResponse({ status: 200, description: 'Returns updated merchant settings' })
  async updateSettings(
    @TenantContext() tenantId: string,
    @Body() dto: UpdateMerchantSettingsDto,
  ) {
    return this.merchantService.updateSettings(tenantId, dto);
  }
}
