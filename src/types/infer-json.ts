import type { Context } from 'hono';

type JSONRespondReturn<T> = { _data: T };

export type InferJson<T extends (c: Context) => Promise<JSONRespondReturn<unknown>>> = Awaited<
	ReturnType<T>
>['_data'];
