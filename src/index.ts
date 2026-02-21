import { init } from './core/bootstrap';
import { WhylogOptions } from './core/config';
import { configure, report } from './reporters/pretty';
import { use, Plugin } from './core/plugins'; // New
import { BreadcrumbTracker } from './core/breadcrumbs';

export const addBreadcrumb = BreadcrumbTracker.add;
export { configure, init, WhylogOptions, use, Plugin };

/**
 * Wraps an async Lambda handler to ensure errors are logged before exit.
 * @param handler The async Lambda handler function
 */
export function wrap(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
       const err = error instanceof Error ? error : new Error(String(error));
       // Await the report to ensure it flushes to stdout/stderr before Lambda freezes the process
       await report(err, 'error');
       throw error; // Re-throw to ensure Lambda marks the invocation as failed
    }
  };
}

/**
 * Express error middleware that intercepts errors, formats them via Whylog,
 * and prevents the default Express error stack trace.
 */
export async function expressErrorHandler(err: any, req: any, res: any, next: any) {
  const error = err instanceof Error ? err : new Error(String(err));
  const context = {
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query
  };
  await report(error, 'error', context);
  
  if (res.headersSent) {
    return next(err);
  }
  
  // Respond to the client directly to prevent Express's default error handler 
  // from printing the raw stack trace.
  res.status(500).json({ error: 'Internal Server Error' });
}

/**
 * Fastify error handler definition
 */
export function fastifyErrorHandler(error: any, request: any, reply: any) {
    const err = error instanceof Error ? error : new Error(String(error));
    const context = {
        url: request.url,
        method: request.method,
        headers: request.headers
    };
    report(err, 'error', context).then(() => {
        reply.status(500).send({ error: 'Internal Server Error' });
    });
}

/**
 * Koa error middleware
 */
export async function koaErrorHandler(ctx: any, next: any) {
  try {
    await next();
  } catch (err: any) {
    const error = err instanceof Error ? err : new Error(String(err));
    const context = {
      url: ctx.url,
      method: ctx.method,
      headers: ctx.headers
    };
    await report(error, 'error', context);
    ctx.status = err.status || 500;
    ctx.body = { error: 'Internal Server Error' };
  }
}

// Auto-initialize with defaults on import so that errors during subsequent requires are caught
init();

export default { configure, wrap, init, expressErrorHandler, fastifyErrorHandler, koaErrorHandler, addBreadcrumb };
