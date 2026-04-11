import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { PlatformAdminService } from './platform-admin.service';

@ApiTags('platform-admin')
@Controller('platform-admin')
@UseGuards(ScopeGuard)
@ApiBearerAuth('JWT-auth')
@RequireScope('platform:*', 'admin:*')
export class PlatformAdminController {
  constructor(private readonly platformAdminService: PlatformAdminService) {}

  @Get('dashboard')
  async getDashboard(@Query('merchantId') merchantId?: string) {
    return this.platformAdminService.getPlatformDashboard(merchantId);
  }

  @Get('merchants')
  async listMerchants() {
    return this.platformAdminService.listMerchants();
  }

  @Get('merchants/:id')
  async getMerchantDetail(@Param('id') id: string) {
    return this.platformAdminService.getMerchantDetail(id);
  }

  @Get('merchants/:id/customers')
  async getMerchantCustomers(
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('status') status?: 'all' | 'active' | 'inactive',
  ) {
    return this.platformAdminService.listMerchantCustomers(id, {
      search,
      sortBy,
      order,
      status,
    });
  }

  @Patch('merchants/:id/status')
  async updateMerchantStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.platformAdminService.updateMerchantStatus(id, body.isActive);
  }

  @Get('customers')
  async listCustomers(@Query('search') search?: string) {
    return this.platformAdminService.listCustomers(search);
  }

  @Get('customers/:id')
  async getCustomerDetail(@Param('id') id: string) {
    return this.platformAdminService.getCustomerDetail(id);
  }

  @Get('customers/:id/audit-trail')
  async getCustomerAuditTrail(@Param('id') id: string) {
    const customer = await this.platformAdminService.getCustomerDetail(id);
    return customer?.auditTrail || [];
  }

  @Get('logs')
  async getLogs() {
    return this.platformAdminService.getLogs();
  }
}
