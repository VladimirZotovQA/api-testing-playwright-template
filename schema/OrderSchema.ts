import { z } from 'zod'


export const OrderDataSchema = z.object({
  status: z.string(),
  courierId: z.number(),
  customerName: z.string(),
  customerPhone: z.string(),
  comment: z.string().nullable(),
  id: z.number(),
}).strict();

export const CreateOrderDataSchema = z.object({
  status: z.string(),
  courierId: z.string().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  comment: z.string().nullable(),
  id: z.number(),
})
.strict();

export const GetOrderResponseSchema = z.
array(
  z.object({
  status: z.string(),
  courierId: z.number().nullable(),
  customerName: z.string(),
  customerPhone: z.string(),
  comment: z.string().nullable(),
  id: z.number(),
}).strict(),
)
