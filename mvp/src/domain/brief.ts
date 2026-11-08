import { z } from "zod";

export const BriefSchema = z.object({
  height: z.number().int().min(120).max(220),
  wheel: z.number().positive(),
  maxPrice: z.number().int().positive().max(1000000),
});

export type Brief = z.infer<typeof BriefSchema>;

export const defaultBrief: Brief = { height: 196, wheel: 29, maxPrice: 60000 };
