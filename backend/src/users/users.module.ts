import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController, StaffController } from './users.controller';
import { User, UserSchema } from '../database/schemas/User.schema';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    OnboardingModule,
  ],
  controllers: [UsersController, StaffController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
