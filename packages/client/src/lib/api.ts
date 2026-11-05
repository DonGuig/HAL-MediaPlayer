import { toast } from "svelte-sonner";

function serverAddress(): string {
  // In production the page is served by the player itself
  if (import.meta.env.PROD) return window.location.host;
  const host = import.meta.env.VITE_LOCAL_DEV_SERVER === "1" ? "127.0.0.1" : import.meta.env.VITE_RASPBERRY_PI_IP;
  return `${host}:${import.meta.env.VITE_SERVER_PORT}`;
}

export const SERVER = serverAddress();
export const SERVER_URL = `http://${SERVER}`;
export const API_URL = `${SERVER_URL}/api`;

const DEFAULT_TIMEOUT_MS = 4000;

type Options = { body?: unknown; silent?: boolean; timeoutMs?: number };

// True if the server couldn't be reached, as opposed to the server answering with an error
export const isConnectionError = (error: unknown): boolean =>
  error instanceof TypeError || (error as Error)?.name === "TimeoutError";

export const errorMessage = (error: unknown): string =>
  isConnectionError(error) ? "The player isn't responding" : (error as Error).message;

async function request<T>(method: "GET" | "POST", path: string, opts: Options = {}): Promise<T> {
  const hasBody = opts.body !== undefined;
  // POST without a body has no default timeout: those are the slow actions (expanding the
  // file system, enabling the read-only mode, copying from USB...)
  const timeoutMs = opts.timeoutMs ?? (method === "GET" || hasBody ? DEFAULT_TIMEOUT_MS : undefined);
  try {
    const res = await fetch(API_URL + path, {
      method,
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      signal: timeoutMs === undefined ? undefined : AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`);
    return (text ? JSON.parse(text) : undefined) as T;
  } catch (err) {
    if (!opts.silent) toast.error(errorMessage(err));
    throw err;
  }
}

export const api = {
  get: <T>(path: string, opts?: Options) => request<T>("GET", path, opts),
  post: <T = void>(path: string, opts?: Options) => request<T>("POST", path, opts),
};

// For actions: resolves to whether it worked, the error has already been shown
export const send = (path: string, opts?: Options): Promise<boolean> =>
  api.post(path, opts).then(
    () => true,
    () => false,
  );
