import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { AppModule } from './app.module';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ZodValidationPipe } from 'nestjs-zod';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Validate environment variables on startup
  validateEnv();
  // @ts-ignore - Fastify adapter type compatibility issue with SwaggerModule
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      requestIdLogLabel: 'requestId',
      disableRequestLogging: false,
      bodyLimit: 10 * 1024 * 1024, // 10 MB — needed for base64 logo uploads
    }),
  );

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  const knownOrigins = [
    'https://proud-forest-0fba2710f.1.azurestaticapps.net',
    'https://purple-ground-02e4fe00f.6.azurestaticapps.net',
  ];

  const rawOrigin = process.env.CORS_ORIGIN || '*';
  const extraOrigins = rawOrigin === '*' ? [] : rawOrigin.split(',').map((o) => o.trim());
  const corsOrigin = [...new Set([...knownOrigins, ...extraOrigins])];

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  });

  // Root health/info endpoint for quick browser checks
  app
    .getHttpAdapter()
    .getInstance()
    .get('/', async (_request: any, reply: any) => {
      return reply.send({
        success: true,
        message: 'SharkBand API is running',
        docs: '/api/docs',
        apiBase: '/api/v1',
      });
    });

  // Global prefix
  app.setGlobalPrefix('api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  // Global validation pipe (Zod)
  app.useGlobalPipes(
    new ZodValidationPipe(),
    new ValidationPipe({
      whitelist: false, // Zod handles validation
      forbidNonWhitelisted: false, // Zod handles validation
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new RequestIdInterceptor());

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('SharkBand API')
    .setDescription('Universal Loyalty Platform API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Idempotency-Key',
        in: 'header',
        description: 'UUID for idempotent requests (required for transaction endpoints)',
      },
      'idempotency-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api/docs', app as any, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 SharkBand API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
