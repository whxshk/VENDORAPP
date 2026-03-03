import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
  @ApiProperty({ description: 'Customer points balance' })
  balance!: number;
}
