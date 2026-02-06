import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, CreateStaffDto } from './users.service';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { UserDocument } from '../database/schemas/User.schema';

@ApiTags('users')
@Controller('users')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireScope('merchant:*')
  async findAll(@TenantContext() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Post()
  @RequireScope('merchant:*')
  async create(
    @TenantContext() tenantId: string,
    @Body() dto: CreateStaffDto,
  ) {
    return this.usersService.create(tenantId, dto);
  }
}

@ApiTags('staff')
@Controller('staff')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class StaffController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireScope('merchant:*')
  async findAll(@TenantContext() tenantId: string) {
    const users = await this.usersService.findAll(tenantId);
    // Transform users to staff format expected by frontend
    return users.map((user: UserDocument) => {
      const role = (user.roles as string[])[0] || 'STAFF';
      // Map backend roles to frontend roles
      const frontendRole = role === 'MERCHANT_ADMIN' ? 'owner' : 
                          role === 'MANAGER' ? 'manager' : 
                          role === 'CASHIER' ? 'cashier' : 'cashier';
      return {
        id: user.id,
        name: user.email.split('@')[0], // Use email prefix as name fallback
        email: user.email,
        role: frontendRole,
        status: user.isActive ? 'active' : 'inactive',
        createdAt: (user as any).createdAt || new Date(),
        tenantId: user.tenantId,
      };
    });
  }
}
