import { Namespace } from 'cls-hooked';

export const getNamespaceMiddleware = (namespace: Namespace) => (_req: Request, _res: Response, next: Function) => {
    namespace.run(() => next());
};
