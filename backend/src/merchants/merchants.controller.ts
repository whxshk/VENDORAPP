import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { RewardsService } from '../rewards/rewards.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly rewardsService: RewardsService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all active merchants (public)' })
  @ApiResponse({ status: 200, description: 'Array of merchant objects' })
  async list(@Query('is_active') isActive?: string) {
    const params =
      isActive !== undefined ? { is_active: isActive !== 'false' } : undefined;
    return this.merchantsService.list(params);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get merchant by ID (public)' })
  @ApiResponse({ status: 200, description: 'Merchant object' })
  @ApiResponse({ status: 404, description: 'Merchant not found' })
  async getOne(@Param('id') id: string) {
    return this.merchantsService.getById(id);
  }

  @Get(':id/rewards')
  @Public()
  @ApiOperation({ summary: 'Get active rewards for a merchant (public)' })
  @ApiResponse({ status: 200, description: 'Array of active reward objects' })
  async getRewards(@Param('id') id: string) {
    const rewards = await this.rewardsService.findAll(id);
    return rewards.filter((r: any) => r.isActive !== false);
  }
}
