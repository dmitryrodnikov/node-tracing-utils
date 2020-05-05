import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { FORMAT_HTTP_HEADERS, Tags } from 'opentracing';
import { JaegerTracer } from 'jaeger-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Namespace } from 'cls-hooked';

import { PREVIOUS_SPAN_NAMESPACE_KEY, TRACER_NAMESPACE_KEY } from '../config';

@Injectable()
export class NestTracingInterceptor implements NestInterceptor {
    constructor(private namespace: Namespace, private tracer: JaegerTracer) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        try {
            const request = context.switchToHttp().getRequest();
            const parentSpan = this.tracer.extract(FORMAT_HTTP_HEADERS, request.headers) || undefined;

            // todo name of Span
            const currentSpan = this.tracer.startSpan('http-request', {
                childOf: parentSpan,
                tags: {
                    contextType: context.getType(),
                    className: context.getClass().name,
                    handlerName: context.getHandler().name,
                    handlerArguments: context.getArgs().values(),
                },
            });

            // Write current Span and tracer to namespace. They will be available in later calls
            this.namespace.set(PREVIOUS_SPAN_NAMESPACE_KEY, currentSpan);
            this.namespace.set(TRACER_NAMESPACE_KEY, this.tracer);

            return this.namespace.runAndReturn(() =>
                next.handle().pipe(
                    tap({
                        next: () => {
                            currentSpan.finish();
                        },
                        error: err => {
                            currentSpan.setTag(Tags.ERROR, true);
                            currentSpan.log({ error: err });
                            currentSpan.finish();
                        },
                    }),
                ),
            );
        } catch (e) {
            return next.handle();
        }
    }
}
