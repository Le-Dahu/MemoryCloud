import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/env';
import { healthRoutes } from './routes/health';
import { projectsRoutes } from './routes/projects';
import { sessionsRoutes } from './routes/sessions';
import { messagesRoutes } from './routes/messages';
import { contextRoutes } from './routes/context';
import { devAuthMiddleware } from './middleware/auth';

const fastify = Fastify({
  logger: true,
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true,
    });

    // Register health route (no auth required)
    await fastify.register(healthRoutes);

    // Register API v1 routes with authentication
    await fastify.register(async (instance) => {
      // Apply authentication middleware to all routes in this scope
      // Using devAuthMiddleware for now (test-user-id)
      // TODO: Replace with authMiddleware when API keys are set up
      instance.addHook('onRequest', devAuthMiddleware);

      // Register all API routes
      await instance.register(projectsRoutes, { prefix: '/projects' });
      await instance.register(sessionsRoutes);
      await instance.register(messagesRoutes);
      await instance.register(contextRoutes);
    }, { prefix: '/api/v1' });

    // Start server
    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`Server listening on port ${config.port}`);
    console.log(`API available at http://localhost:${config.port}/api/v1`);
    console.log(`Health check at http://localhost:${config.port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
