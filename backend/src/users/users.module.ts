import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, StaffController } from './users.controller';

@Module({
  controllers: [UsersController, StaffController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
