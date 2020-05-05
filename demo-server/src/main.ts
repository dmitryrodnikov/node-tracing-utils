import { NestFactory } from '@nestjs/core';
import { AppModule } from './app-module';
import { getNamespaceMiddleware } from '../../src/namespace-middleware';
import { createNamespace } from 'cls-hooked';

const projectNamespace = createNamespace('project-namespace');

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
    app.use(getNamespaceMiddleware(projectNamespace));
}

bootstrap();
