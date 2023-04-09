declare module "sse.js" {
  export default class SSE {
    constructor(
      url: string,
      options?: {
        payload: string;
        withCredentials?: boolean;
        headers?: Record<string, string>;
        timeout?: number;
        retry?: number;
        onOpen?: (event: Event) => void;
        onMessage?: (event: MessageEvent) => void;
        onError?: (event: Event) => void;
        onRetry?: (event: Event) => void;
        onReconnect?: (event: Event) => void;
        onReconnecting?: (event: Event) => void;
        onReconnected?: (event: Event) => void;

        onReconnectFailed?: (event: Event) => void;
        onReconnectAttempt?: (event: Event) => void;
      }
    );
    close(): void;
    on(event: string, callback: (event: Event) => void): void;
    off(event: string, callback: (event: Event) => void): void;
    once(event: string, callback: (event: Event) => void): void;
    addEventListener(event: string, callback: (event: Event) => void): void;
    removeEventListener(event: string, callback: (event: Event) => void): void;
  }
}
