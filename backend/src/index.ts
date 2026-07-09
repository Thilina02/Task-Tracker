import { createServer } from 'http';
import app from './app';
import { env, assertRequiredEnv } from './config/env';
import { initSocket } from './lib/socket';

assertRequiredEnv();

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, '0.0.0.0', () => {
  console.log(`Server running on port ${env.port}`);
});
