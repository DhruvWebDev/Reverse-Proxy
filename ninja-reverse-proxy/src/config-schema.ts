import { z } from 'zod';

// Define the schema for an individual upstream node
const upstreamNodeSchema = z.object({
  id: z.string(),
  url: z.string(),
});

// Define the schema for the headers
const headerSchema = z.object({
  key: z.string(),
  value: z.string(),
});

// Define the schema for the routing rules
//This defines a property named upstream that must be an array of strings.

const ruleSchema = z.object({
  path: z.string(),
  upstream: z.array(z.string()),
});

// Define the main server configuration schema
const serverSchema = z.object({
  listen: z.number(),
  workers: z.number().optional(),
  upstream: z.array(upstreamNodeSchema),
  headers: z.array(headerSchema).optional(),
  rules: z.array(ruleSchema),
});

export const rootSchema = z.object({
    server: serverSchema,
});

export type configSchemaType = z.infer<typeof rootSchema>;