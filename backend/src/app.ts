import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { prisma } from './lib/prisma'; // 1. Import your prisma instance

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  env.frontendUrl,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; 

    res.json({ 
      status: 'ok', 
      database: 'connected',
      message: 'Task Tracker API and Database are running' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      message: error instanceof Error ? error.message : 'Database ping failed' 
    });
  }
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;