import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService, CreateLocationDto } from './locations.service';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('locations')
@Controller('locations')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequireScope('merchant:*')
  async findAll(@TenantContext() tenantId: string) {
    return this.locationsService.findAll(tenantId);
  }

  @Post()
  @RequireScope('merchant:*')
  async create(
    @TenantContext() tenantId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.locationsService.create(tenantId, dto);
  }
}
