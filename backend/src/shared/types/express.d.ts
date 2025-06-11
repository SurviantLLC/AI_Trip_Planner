declare module 'express' {
  export * from 'express-serve-static-core';
  export * from 'serve-static';
  export * from 'body-parser';
}

declare module 'express-rate-limit' {
  import { RequestHandler } from 'express';
  
  interface Options {
    windowMs?: number;
    max?: number;
    message?: string | object;
    statusCode?: number;
    headers?: boolean;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    keyGenerator?: (req: any) => string;
    skip?: (req: any) => boolean;
  }
  
  function rateLimit(options?: Options): RequestHandler;
  
  export { rateLimit };
}

declare module 'http-status-codes' {
  export const StatusCodes: {
    OK: number;
    CREATED: number;
    BAD_REQUEST: number;
    UNAUTHORIZED: number;
    FORBIDDEN: number;
    NOT_FOUND: number;
    INTERNAL_SERVER_ERROR: number;
    [key: string]: number;
  };
}
