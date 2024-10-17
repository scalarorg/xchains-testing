import { z } from "zod";

const ProjectENVSchema = z.object({
  NETWORK: z.string().default("testnet"),
  PROTOCOL_PUBLIC_KEY: z.string(),
  COVENANT_PUBLIC_KEYS: z.string(),
});

/**
 * Return system ENV with parsed values
 */
export const ProjectENV = ProjectENVSchema.parse({
  NETWORK: process.env.NETWORK,
  PROTOCOL_PUBLIC_KEY: process.env.PROTOCOL_PUBLIC_KEY,
  COVENANT_PUBLIC_KEYS: process.env.COVENANT_PUBLIC_KEYS,
});
