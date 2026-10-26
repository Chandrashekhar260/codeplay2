import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

async function bootstrap() {
  try {
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 Srujana DPDP API running on port ${env.PORT}`);
      console.log(`   Environment: ${env.NODE_ENV}`);
      console.log(`   Health Check: http://localhost:${env.PORT}/health`);
      console.log(`====================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database connection closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
