export interface ExpressRequest {}
export interface ExpressResponse {
  status(code: number): ExpressResponse;
  send(body: unknown): void;
  end(body?: unknown): void;
}
export interface ExpressApp {
  get(path: string, handler: (req: ExpressRequest, res: ExpressResponse) => void): ExpressApp;
  use(...args: unknown[]): ExpressApp;
  set(name: string, value: unknown): ExpressApp;
  listen(port: number, callback?: () => void): { close(): void; port: number };
}
export interface Router {
  get(path: string, handler: (req: ExpressRequest, res: ExpressResponse) => void): Router;
  use(...args: unknown[]): Router;
}
export default function express(): ExpressApp;
export declare function Router(): Router;
export declare function json(): unknown;
export declare function urlencoded(): unknown;
