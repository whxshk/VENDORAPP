import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VerifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  purpose: z.enum(['login', 'signup']),
  tenantId: z.string().optional(),
});

export class VerifyOtpDto extends createZodDto(VerifyOtpSchema) {}
