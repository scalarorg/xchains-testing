import { z } from "zod";

const ProjectENVSchema = z.object({
  BTC_CLIENT_TYPE: z.string().default("testnet"),
  MEMPOOL_CLIENT_TYPE: z.string().default("testnet"),
  PROTOCOL_PUBLIC_KEY: z.string(),
  COVENANT_PUBLIC_KEYS: z.string(),
});

/**
 * Return system ENV with parsed values
 */
export const ProjectENV = ProjectENVSchema.parse({
  BTC_CLIENT_TYPE: process.env.BTC_CLIENT_TYPE,
  MEMPOOL_CLIENT_TYPE: process.env.MEMPOOL_CLIENT_TYPE,
  PROTOCOL_PUBLIC_KEY: process.env.PROTOCOL_PUBLIC_KEY,
  COVENANT_PUBLIC_KEYS: process.env.COVENANT_PUBLIC_KEYS,
});
