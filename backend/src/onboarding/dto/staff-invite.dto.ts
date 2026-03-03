import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const StaffInviteSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['owner', 'manager', 'cashier', 'staff', 'janitor']).default('staff'),
  scopes: z.array(z.string()).optional(),
});

export class StaffInviteDto extends createZodDto(StaffInviteSchema) {}
