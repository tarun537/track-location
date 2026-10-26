import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvironmentSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().default('http://localhost:5000'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/locato_dev'),
  TOKEN_SALT: z.string().default('dev_pepper_salt_string_12345'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = EnvironmentSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
