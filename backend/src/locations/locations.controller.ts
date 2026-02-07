import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LocationsService, CreateLocationDto, UpdateLocationDto } from './locations.service';
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

  @Get(':id')
  @RequireScope('merchant:*')
  async findOne(@TenantContext() tenantId: string, @Param('id') id: string) {
    return this.locationsService.findOne(tenantId, id);
  }

  @Post()
  @RequireScope('merchant:*')
  async create(@TenantContext() tenantId: string, @Body() dto: CreateLocationDto) {
    return this.locationsService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequireScope('merchant:*')
  async update(
    @TenantContext() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequireScope('merchant:*')
  async delete(@TenantContext() tenantId: string, @Param('id') id: string) {
    return this.locationsService.delete(tenantId, id);
  }
}
