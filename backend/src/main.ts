import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { RolesGuard } from './common/guards/roles.guard';
import { FeatureGuard } from './common/guards/feature.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/api/uploads' });
  app.setGlobalPrefix('api');
  app.useGlobalGuards(new RolesGuard(app.get(Reflector)), new FeatureGuard(app.get(Reflector)));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Study Hall SaaS backend running on http://localhost:${port}/api`);
}

bootstrap();
