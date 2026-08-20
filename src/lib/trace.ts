type TraceMeta = Record<string, unknown>;

const SERVER_TRACE_ENABLED = process.env.TRACE_LOGS !== "0";

function nowMs() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function toErrorMeta(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { error };
}

export function trace(scope: string, event: string, meta?: TraceMeta) {
  if (!SERVER_TRACE_ENABLED) return;
  if (meta) {
    console.log(`[trace][${scope}] ${event}`, meta);
    return;
  }
  console.log(`[trace][${scope}] ${event}`);
}

export async function traceAsync<T>(scope: string, label: string, fn: () => Promise<T>, meta?: TraceMeta): Promise<T> {
  const start = nowMs();
  trace(scope, `${label}:start`, meta);
  try {
    const result = await fn();
    trace(scope, `${label}:done`, { ...(meta ?? {}), durationMs: Number((nowMs() - start).toFixed(2)) });
    return result;
  } catch (error) {
    trace(scope, `${label}:error`, {
      ...(meta ?? {}),
      durationMs: Number((nowMs() - start).toFixed(2)),
      ...toErrorMeta(error),
    });
    throw error;
  }
}

export type RouteHandler = (req: Request, ctx?: unknown) => Promise<Response>;

export function withRouteLogging(scope: string, method: string, handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx?: unknown) => {
    const start = nowMs();
    const url = new URL(req.url);
    trace(scope, `${method}:start`, {
      path: url.pathname,
      query: url.search,
    });

    try {
      const response = await handler(req, ctx);
      trace(scope, `${method}:done`, {
        path: url.pathname,
        status: response.status,
        durationMs: Number((nowMs() - start).toFixed(2)),
      });
      return response;
    } catch (error) {
      trace(scope, `${method}:error`, {
        path: url.pathname,
        durationMs: Number((nowMs() - start).toFixed(2)),
        ...toErrorMeta(error),
      });
      throw error;
    }
  };
}
