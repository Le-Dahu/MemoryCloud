import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/env';
import { healthRoutes } from './routes/health';

const fastify = Fastify({
  logger: true,
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true,
    });

    // Register routes
    await fastify.register(healthRoutes);

    // Start server
    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`Server listening on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
