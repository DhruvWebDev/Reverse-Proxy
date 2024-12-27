import { promises as fs } from 'fs';
import { parse } from 'yaml';
import { rootSchema } from './config-schema';

// Corrected the function declaration syntax and filePath usage
export async function parseConfig(filePath: string) {
  const data = await fs.readFile(filePath, 'utf-8'); // Use filePath here
  const parsedData = parse(data); // Parse YAML data
  return parsedData; // Return parsed data, not raw data
}

// Corrected function name and validation logic
export async function validateConfig(config: any) {
  const validatedContent = await rootSchema.parseAsync(config); // Validate parsed content
  return validatedContent; // Return validated content
}
