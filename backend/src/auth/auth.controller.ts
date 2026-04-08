import { Controller, Post, Body, Get, UseGuards, HttpCode } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPayload } from '../common/decorators/current-user.decorator';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.registerCustomer(registerDto);
  }

  @Public()
  @Post('request-register-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a customer account and email a verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  async requestRegisterOtp(@Body() registerDto: RegisterDto) {
    return this.authService.requestRegisterOtp(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('request-login-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validate credentials and email a login verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent successfully' })
  async requestLoginOtp(@Body() loginDto: LoginDto) {
    return this.authService.requestLoginOtp(loginDto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify a 6-digit email code and issue auth tokens' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.refresh_token);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent successfully' })
  @ApiResponse({ status: 404, description: 'Email address not found' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@CurrentUser() user: UserPayload) {
    const tenant = await this.tenantModel
      .findById(user.tenantId)
      .select('hasCompletedOnboarding')
      .exec();
    return {
      userId: user.userId,
      tenantId: user.tenantId,
      email: user.email,
      scopes: user.scopes,
      roles: user.roles,
      hasCompletedOnboarding: tenant?.hasCompletedOnboarding ?? false,
    };
  }
}
