import { bus } from '../core/bus';
import { config } from '../core/config';

export function attachListeners() {
  if (typeof window !== 'undefined') {
    // Browser Environment
    const originalOnError = window.onerror;
    window.onerror = (msg, url, line, col, error) => {
      const err = error instanceof Error ? error : new Error(String(msg));
      if (config.shouldIgnored(err)) return false;

      bus.emit(err, 'error');
      
      if (typeof originalOnError === 'function') {
        return originalOnError.call(window, msg, url, line, col, error);
      }
      return false; 
    };

    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason));
      
      if (config.shouldIgnored(err)) return;

      bus.emit(err, 'unhandledRejection');
      
      if (typeof originalOnUnhandledRejection === 'function') {
        return originalOnUnhandledRejection.call(window, event);
      }
    };

  } else if (typeof process !== 'undefined') {
    // Node Environment
    process.on('uncaughtException', (err) => {
      if (config.shouldIgnored(err)) {
          process.exit(1); 
          return; 
      }
      bus.emit(err, 'error');
    });

    process.on('unhandledRejection', (reason) => {
      if (reason instanceof Error) {
        bus.emit(reason, 'unhandledRejection');
      } else {
         bus.emit(new Error(String(reason)), 'unhandledRejection');
      }
    });

    // Intercept Node Warnings
    // Only if showWarnings is true (default)
    if (config.get().showWarnings !== false) {
        process.removeAllListeners('warning');

        process.on('warning', (warning) => {
          const err = warning instanceof Error ? warning : new Error(String(warning));
          if (config.shouldIgnored(err)) return;
          bus.emit(err, 'warning');
        });
    }
  }
}

// Legacy alias
export const registerHooks = attachListeners;
