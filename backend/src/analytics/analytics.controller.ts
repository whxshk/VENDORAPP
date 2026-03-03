import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { PilotReportsService } from './pilot-reports.service';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly pilotReportsService: PilotReportsService,
  ) {}

  @Get('dashboard')
  @RequireScope('merchant:*')
  async getDashboard(
    @TenantContext() tenantId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.analyticsService.getDashboard(tenantId, locationId);
  }

  @Get('pilot-weekly-report')
  @RequireScope('merchant:*')
  @ApiOperation({ summary: 'Get weekly pilot report (merchant admin only)' })
  async getWeeklyReport(
    @TenantContext() tenantId: string,
    @Query('week') week?: string,
  ) {
    // Default to current week if not provided
    const weekParam = week || this.getCurrentWeek();
    return this.pilotReportsService.getWeeklyReport(tenantId, weekParam);
  }

  @Get('pilot-onboarding-funnel')
  @RequireScope('merchant:*')
  @ApiOperation({ summary: 'Get onboarding funnel metrics (time-to-first-value)' })
  async getOnboardingFunnel(@TenantContext() tenantId: string) {
    return this.pilotReportsService.getOnboardingFunnel(tenantId);
  }

  private getCurrentWeek(): string {
    // Use ISO week format to match pilot report week calculations
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${utcDate.getUTCFullYear()}-${weekNum}`;
  }
}
