import { ApiProperty } from '@nestjs/swagger';

export class QrTokenResponseDto {
  @ApiProperty({ description: 'QR payload string to render (Design 1)' })
  qrPayload!: string;

  @ApiProperty({ description: 'Expiry time Unix ms' })
  expiresAt!: number;

  @ApiProperty({ description: 'Refresh interval in seconds' })
  refreshIntervalSec!: number;
}
