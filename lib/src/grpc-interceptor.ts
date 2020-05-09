import * as grpc from 'grpc';
import { JaegerTracer } from 'jaeger-client';
import { FORMAT_HTTP_HEADERS, Span, Tags } from 'opentracing';

export const grpcTracingInterceptor = (
    tracer: JaegerTracer | undefined,
    previousSpan: Span | undefined,
    options: grpc.CallOptions,
    nextCall: Function,
): grpc.InterceptingCall => {
    const requestPath: string | undefined = options?.method_definition?.path;

    const currentSpan = tracer?.startSpan(requestPath, {
        childOf: previousSpan?.context(),
        tags: {
            [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
            [Tags.HTTP_URL]: requestPath,
            parentCall: options.parent,
            deadline: options.deadline,
            host: options.host,
            credentials: options.credentials,
        },
    });

    const requester: grpc.Requester = {
        start(metadata, _listener, next) {
            try {
                const headers: Record<string, string> = {};
                currentSpan && tracer?.inject(currentSpan, FORMAT_HTTP_HEADERS, headers);
                for (const key in headers) {
                    if (Object.prototype.hasOwnProperty.call(headers, key)) {
                        metadata.set(key, headers[key]);
                    }
                }
                currentSpan?.log({ start: metadata });
            } catch (e) {
                currentSpan?.log({ setGRPCMetadataError: e });
            }

            const newListener: grpc.Listener = {
                onReceiveMetadata(receiveMetadata, onReceiveMetadataNext) {
                    onReceiveMetadataNext(receiveMetadata);
                },

                onReceiveMessage(receiveMessage, onReceiveMessageNext) {
                    onReceiveMessageNext(receiveMessage);
                },

                onReceiveStatus(receiveStatus, onReceiveStatusNext) {
                    currentSpan?.finish();
                    onReceiveStatusNext(receiveStatus);
                },
            };

            next(metadata, newListener);
        },

        sendMessage(message, next) {
            next(message);
        },

        halfClose(next) {
            currentSpan?.addTags({ halfClose: true });
            next();
        },

        cancel(next) {
            currentSpan?.addTags({ cancel: true });
            currentSpan?.finish();
            next();
        },
    };

    return new grpc.InterceptingCall(nextCall(options), requester);
};
