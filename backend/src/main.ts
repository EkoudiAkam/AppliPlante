import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have decorators
      forbidNonWhitelisted: false, // Don't throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allow implicit type conversion
      },
      disableErrorMessages: false, // Enable detailed error messages
      exceptionFactory: (errors) => {
        console.log('🔍 Validation errors details:', JSON.stringify(errors, null, 2));
        return new BadRequestException(errors);
      },
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('PlantCare API')
    .setDescription('API de gestion des plantes d\'intérieur - Système complet pour suivre l\'arrosage et l\'entretien de vos plantes')
    .setVersion('1.0')
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('users', 'Gestion des profils utilisateurs')
    .addTag('plants', 'Gestion des plantes')
    .addTag('waterings', 'Suivi des arrosages')
    .addTag('notifications', 'Système de notifications')
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'PlantCare API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);

  console.log(`🌱 Plant Care API is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
