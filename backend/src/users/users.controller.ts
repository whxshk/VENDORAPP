import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, CreateStaffDto, UpdateStaffDto } from './users.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
  constructor(
    private readonly usersService: UsersService,
    private readonly onboardingService: OnboardingService,
  ) {}

  private toBackendRole(role?: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor') {
    if (role === 'owner') return 'MERCHANT_ADMIN';
    if (role === 'manager') return 'MANAGER';
    if (role === 'cashier') return 'CASHIER';
    if (role === 'janitor') return 'JANITOR';
    if (role === 'staff') return 'STAFF';
    return undefined;
  }

  @Get()
  @RequireScope('merchant:*')
  async findAll(@TenantContext() tenantId: string) {
    const users = await this.usersService.findAll(tenantId);
    // Transform users to staff format expected by frontend
    return users.map((user: UserDocument) => {
      const role = (user.roles as string[])[0] || 'STAFF';
      // Map backend roles to frontend roles
      const frontendRole = role === 'MERCHANT_ADMIN'
        ? 'owner'
        : role === 'MANAGER'
          ? 'manager'
          : role === 'CASHIER'
            ? 'cashier'
            : role === 'JANITOR'
              ? 'janitor'
            : 'staff';
      return {
        id: user.id,
        name: (user as any).name || user.email.split('@')[0],
        email: user.email,
        role: frontendRole,
        status: user.isActive ? 'active' : 'inactive',
        createdAt: (user as any).createdAt || new Date(),
        tenantId: user.tenantId,
      };
    });
  }

  @Post('invite')
  @RequireScope('merchant:*')
  async invite(
    @TenantContext() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: { email: string; role: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor' },
  ) {
    const result = await this.onboardingService.inviteStaff(tenantId, user.userId, {
      email: dto.email,
      role: dto.role || 'staff',
    });

    return {
      success: true,
      email: result.email,
      role: dto.role || 'staff',
      inviteLink: result.inviteLink,
      emailSent: result.emailSent,
    };
  }

  @Patch(':id')
  @RequireScope('merchant:*')
  async update(
    @TenantContext() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { name?: string; email?: string; role?: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor'; password?: string },
  ) {
    const updateDto: UpdateStaffDto = {
      name: dto.name,
      email: dto.email,
      role: this.toBackendRole(dto.role),
      password: dto.password,
    };

    const user = await this.usersService.update(tenantId, id, updateDto);
    const role = (user?.roles as string[])?.[0] || 'STAFF';
    const frontendRole = role === 'MERCHANT_ADMIN'
      ? 'owner'
      : role === 'MANAGER'
        ? 'manager'
        : role === 'CASHIER'
          ? 'cashier'
          : role === 'JANITOR'
            ? 'janitor'
          : 'staff';

    return {
      id: user?.id,
      name: (user as any)?.name || user?.email?.split('@')[0] || '',
      email: user?.email || '',
      role: frontendRole,
      status: user?.isActive ? 'active' : 'inactive',
      createdAt: (user as any)?.createdAt || new Date(),
      tenantId: user?.tenantId || tenantId,
    };
  }
}
