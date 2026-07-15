import { z } from 'zod';

export const balanceCompanyQuerySchema = z.object({ companyId: z.string().uuid() });

export type BalanceCompanyQueryDto = z.infer<typeof balanceCompanyQuerySchema>;
