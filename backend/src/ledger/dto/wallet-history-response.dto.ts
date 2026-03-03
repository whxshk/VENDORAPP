import { ApiProperty } from '@nestjs/swagger';

export class WalletHistoryResponseDto {
  @ApiProperty({ description: 'Ledger entries' })
  entries!: Array<{
    id: string;
    transactionId: string;
    amount: number;
    balanceAfter: number;
    operationType: string;
    createdAt: Date | string;
  }>;

  @ApiProperty({ description: 'Pagination' })
  pagination!: { page: number; limit: number; total: number; totalPages: number };
}
