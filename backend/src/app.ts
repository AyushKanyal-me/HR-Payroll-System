import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error.js';
import { apiV1Router } from './routes/index.js';
import { sendSuccess } from './utils/response.js';
import { NotFoundError } from './utils/errors.js';

const app: Express = express();

// Security and utility middlewares
app.use(helmet());

const corsOrigin = (() => {
  if (!env.CORS_ORIGIN || env.CORS_ORIGIN === '*') {
    return true; // Reflect origin to allow any origin with credentials: true
  }
  const origins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
})();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

/**
 * Root Health Check
 * GET /health
 */
app.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok'
  });
});

// Mount Versioned API router
app.use(env.API_PREFIX, apiV1Router);

// 404 Handler for unmatched routes
app.use((_req, _res, next) => {
  next(new NotFoundError('The requested endpoint was not found on this server'));
});

// Centralized error handler (must be last)
app.use(errorHandler);

export { app };
