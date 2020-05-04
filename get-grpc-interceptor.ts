import * as grpc from 'grpc';
import { getNamespace, Namespace } from 'cls-hooked';
import { JaegerTracer } from 'jaeger-client';
import { Span } from 'opentracing';

import { PREVIOUS_SPAN_NAMESPACE_KEY, TRACER_NAMESPACE_KEY } from './config';
import { grpcTracingInterceptor } from './grpc-interceptor';

export const getGrpcTracingInterceptor = (namespaceName: string) => {
    return (options: grpc.CallOptions, nextCall: Function) => {
        const namespace: Namespace | undefined = getNamespace(namespaceName);
        // Tracer should be assigned to namespace before execution of this line
        const tracer: JaegerTracer | undefined = namespace?.get(TRACER_NAMESPACE_KEY);
        // PreviousSpan should be assigned to namespace before execution of this line
        const previousSpan: Span | undefined = namespace?.get(PREVIOUS_SPAN_NAMESPACE_KEY);

        return grpcTracingInterceptor(tracer, previousSpan, options, nextCall);
    };
};
