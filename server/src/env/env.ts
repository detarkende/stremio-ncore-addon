import { envSchema } from './env.schema';

export const env = envSchema.parse(process.env);

console.log('Environment variables parsed and loaded successfully.');
