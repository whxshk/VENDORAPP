import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
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

  /**
   * GET /merchants/nearby?lat=25.2854&lng=51.5310&radius=5000
   * Returns merchants sorted by distance from the given coordinates.
   * Only merchants that have been geocoded are returned.
   * Must be declared BEFORE :id to avoid "nearby" being treated as an ID.
   */
  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Find merchants near a location (public)' })
  @ApiQuery({ name: 'lat', required: true, description: 'User latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'User longitude' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in metres (default 25000)' })
  @ApiResponse({ status: 200, description: 'Array of nearby merchants sorted by distance, each with distance_meters' })
  async nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = radius ? parseFloat(radius) : 25000;

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      throw new BadRequestException('lat and lng must be valid numbers');
    }
    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      throw new BadRequestException('lat must be in [-90, 90] and lng in [-180, 180]');
    }
    if (parsedRadius <= 0 || parsedRadius > 100_000) {
      throw new BadRequestException('radius must be between 1 and 100000 metres');
    }

    return this.merchantsService.nearby(parsedLat, parsedLng, parsedRadius);
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
