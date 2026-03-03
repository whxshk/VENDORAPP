import { Controller, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OperatorToolsService } from './operator-tools.service';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../common/decorators/idempotency-key.decorator';

@ApiTags('operator-tools')
@Controller('operator-tools')
@UseGuards(ScopeGuard, TenantGuard)
@RequireScope('merchant:*')
@ApiBearerAuth('JWT-auth')
export class OperatorToolsController {
  constructor(private readonly operatorToolsService: OperatorToolsService) {}

  @Patch('tenants/:id/disable')
  @ApiOperation({ summary: 'Disable tenant (kill-switch)' })
  @ApiResponse({ status: 200, description: 'Tenant disabled' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async disableTenant(@Param('id') id: string, @TenantContext() tenantId: string) {
    return this.operatorToolsService.disableTenant(tenantId, id);
  }

  @Patch('tenants/:id/enable')
  @ApiOperation({ summary: 'Enable tenant' })
  @ApiResponse({ status: 200, description: 'Tenant enabled' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async enableTenant(@Param('id') id: string, @TenantContext() tenantId: string) {
    return this.operatorToolsService.enableTenant(tenantId, id);
  }

  @Patch('users/:id/disable')
  @ApiOperation({ summary: 'Disable staff user (kill-switch)' })
  @ApiResponse({ status: 200, description: 'User disabled' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async disableUser(
    @Param('id') id: string,
    @TenantContext() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.operatorToolsService.disableUser(tenantId, id, user.userId);
  }

  @Patch('users/:id/enable')
  @ApiOperation({ summary: 'Enable staff user' })
  @ApiResponse({ status: 200, description: 'User enabled' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async enableUser(
    @Param('id') id: string,
    @TenantContext() tenantId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.operatorToolsService.enableUser(tenantId, id, user.userId);
  }

  @Patch('customers/:id/disable')
  @ApiOperation({ summary: 'Disable customer membership (kill-switch)' })
  @ApiResponse({ status: 200, description: 'Customer disabled' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async disableCustomer(@Param('id') id: string, @TenantContext() tenantId: string) {
    return this.operatorToolsService.disableCustomer(tenantId, id);
  }

  @Patch('customers/:id/enable')
  @ApiOperation({ summary: 'Enable customer membership' })
  @ApiResponse({ status: 200, description: 'Customer enabled' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async enableCustomer(@Param('id') id: string, @TenantContext() tenantId: string) {
    return this.operatorToolsService.enableCustomer(tenantId, id);
  }

  @Post('adjustment')
  @ApiOperation({ summary: 'Manual adjustment (credit/debit) - merchant admin only' })
  async manualAdjustment(
    @Body() body: { customerId: string; amount: number; reason: string },
    @TenantContext() tenantId: string,
    @CurrentUser() user: any,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    return this.operatorToolsService.manualAdjustment(
      tenantId,
      body.customerId,
      body.amount,
      body.reason,
      user.userId,
      idempotencyKey,
    );
  }

  @Post('reverse')
  @ApiOperation({ summary: 'Reverse transaction - merchant admin only' })
  async reverseTransaction(
    @Body() body: { transactionId: string; reason: string },
    @TenantContext() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.operatorToolsService.reverseTransaction(
      tenantId,
      body.transactionId,
      body.reason,
      user.userId,
    );
  }
}
