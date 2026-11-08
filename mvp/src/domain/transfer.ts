import { z } from "zod";
import { BriefSchema } from "./brief.ts";
import { ListingSchema, MAX_LISTINGS } from "./listing.ts";

export const BundleSchema = z.object({
  schemaVersion: z.literal(1),
  listings: z.array(ListingSchema).max(MAX_LISTINGS),
  brief: BriefSchema,
});

export type Bundle = z.infer<typeof BundleSchema>;
