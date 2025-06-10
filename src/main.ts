import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path'; // 👈 Add this
import * as bodyParser from 'body-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
  });

  // 🚀 Serve static files from uploads folder
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

    // ✅ Apply raw body parser ONLY for the Stripe webhook route
  app.use('/webhook/stripe', express.raw({ type: 'application/json' }));

  // ✅ Apply JSON parser for all other routes AFTER the raw body
  app.use(bodyParser.json());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Gamer Gizmo')
    .setDescription('Gamer Gizmo API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'X-Org-Auth', in: 'header' },
      'X-Org-Auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());

 

  await app.listen(4001);
}
bootstrap();
