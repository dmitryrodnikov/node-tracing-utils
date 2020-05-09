import { NestFactory } from '@nestjs/core';
import { AppModule } from './app-module';
import { getNamespaceMiddleware } from '../../lib/src/namespace-middleware';
import { createNamespace } from 'cls-hooked';
import { NestTracingInterceptor } from '../../lib/src/nest/nest-interceptor';
import { initTracer } from 'jaeger-client';

const projectNamespace = createNamespace('project-namespace');
const tracingConfig = {
    serviceName: 'items-service',
    reporter: {
        collectorEndpoint: '', // todo
    },
};
const tracingOptions = {};
const tracer = initTracer(tracingConfig, tracingOptions);

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
    app.use(getNamespaceMiddleware(projectNamespace));
    app.useGlobalInterceptors(new NestTracingInterceptor(projectNamespace, tracer));
}

bootstrap();
