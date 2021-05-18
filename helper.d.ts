type Unpacked<T> = T extends (infer U)[] ? U : T

type ResolvedPromise<P> = P extends Promise<infer R> ? R : P
