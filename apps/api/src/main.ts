import 'reflect-metadata';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createApiApplication } from './bootstrap.js';

const app = await createApiApplication();
await app.listen(Number(process.env.PORT || 4000), '0.0.0.0');
