import { Controller, Get, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { QrTokenResponseDto } from './dto/qr-token-response.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schemas/User.schema';
import { ScopeGuard } from '../common/guards/scope.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequireScope } from '../common/decorators/require-scope.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(ScopeGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get()
  @RequireScope('merchant:*')
  async findAll(
    @TenantContext() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.customersService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
    });
  }

  @Get('me/qr-token')
  @RequireScope('customer:*')
  @ApiOperation({ summary: 'Get rotating QR payload for customer app' })
  @ApiResponse({ status: 200, description: 'QR token', type: QrTokenResponseDto })
  @ApiResponse({ status: 403, description: 'Not linked to a customer' })
  async getQrToken(
    @CurrentUser() user: { userId: string; tenantId: string },
    @TenantContext() tenantId: string,
  ): Promise<QrTokenResponseDto> {
    const dbUser = await this.userModel.findOne({
      _id: user.userId,
      tenantId,
    }).select('customerId').exec();
    if (!dbUser?.customerId) {
      throw new ForbiddenException('Not linked to a customer. Use a customer-linked account.');
    }
    return this.customersService.getQrToken(dbUser.customerId);
  }

  @Get(':id')
  @RequireScope('merchant:*')
  async findOne(
    @TenantContext() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(tenantId, id);
  }
}
