import { trace } from "@/lib/trace";

const globalTraceState = globalThis as typeof globalThis & {
  __raotechServerFetchPatched?: boolean;
};

export async function register() {
  if (globalTraceState.__raotechServerFetchPatched) return;
  globalTraceState.__raotechServerFetchPatched = true;

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
    const input = args[0];
    const requestInfo =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const startedAt = Date.now();
    trace("server-fetch", "start", { request: requestInfo });

    try {
      const response = await originalFetch(...args);
      trace("server-fetch", "done", {
        request: requestInfo,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return response;
    } catch (error) {
      trace("server-fetch", "error", {
        request: requestInfo,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  trace("instrumentation", "server fetch patch installed");
}
