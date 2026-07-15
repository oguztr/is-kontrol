import { z } from 'zod';

export const idParamSchema = z.string().uuid();

export type IdParamDto = z.infer<typeof idParamSchema>;
