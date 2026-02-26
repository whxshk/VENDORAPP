declare module "stremio-addon-sdk" {
  export class addonBuilder {
    constructor(manifest: Record<string, unknown>);
    defineStreamHandler(handler: (args: { type: string; id: string }) => Promise<{ streams: Array<Record<string, unknown>> }>): void;
    getInterface(): Record<string, unknown>;
  }

  export function getRouter(addonInterface: Record<string, unknown>): import("express").Router;
}
