import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ScanApplySchema = z
  .object({
    qrPayload: z.string().min(1, 'qrPayload is required'),
    purpose: z.enum(['CHECKIN', 'PURCHASE', 'REDEEM']),
    amount: z.number().positive().optional(),
    rewardId: z.string().uuid().optional(),
    deviceId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (d) => (d.purpose === 'PURCHASE' ? d.amount != null && d.amount > 0 : true),
    { message: 'amount is required and must be > 0 for PURCHASE', path: ['amount'] },
  )
  .refine(
    (d) => (d.purpose === 'REDEEM' ? !!d.rewardId : true),
    { message: 'rewardId is required for REDEEM', path: ['rewardId'] },
  );

export class ScanApplyDto extends createZodDto(ScanApplySchema) {}
