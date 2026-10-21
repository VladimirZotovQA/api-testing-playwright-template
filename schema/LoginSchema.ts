import { z } from 'zod';

export const LoginRequestBodySchema = z.object({
  username: z.string(),
  password: z.string(),
}).strict();

export const TokenSchema = z.jwt()