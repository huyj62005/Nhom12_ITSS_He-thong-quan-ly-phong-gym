import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
  });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[be-he-thong] listening on http://localhost:${port} | DATABASE_URL=${process.env.DATABASE_URL ? 'present' : 'missing'}`,
  );
}
bootstrap();
