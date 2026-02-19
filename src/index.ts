import { init } from './core/bootstrap';
import { WhylogOptions } from './core/config';
import { configure, report } from './reporters/pretty';
import { use, Plugin } from './core/plugins'; // New

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

export default { configure, wrap, init };
