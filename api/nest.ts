import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { createApiApplication } from '../apps/api/src/bootstrap.js';

let application: Promise<INestApplication> | undefined;

async function getApplication() {
  application ??= createApiApplication().then(async (app) => {
    await app.init();
    return app;
  });
  return application;
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const app = await getApplication();
  const express = app.getHttpAdapter().getInstance() as (req: IncomingMessage, res: ServerResponse) => void;
  return express(request, response);
}
