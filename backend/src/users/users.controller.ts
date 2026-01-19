import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

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
    return users.map((user) => ({
      id: user.id,
      name: user.email.split('@')[0], // Use email prefix as name fallback
      email: user.email,
      role: (user.roles as string[])[0] || 'CASHIER',
      status: user.isActive ? 'active' : 'inactive',
      createdAt: user.createdAt,
      tenantId: user.tenantId,
    }));
  }
}
