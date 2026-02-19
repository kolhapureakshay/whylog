import { attachListeners } from '../platform/index';
import { bus } from './bus';
import { LogThrottler } from './throttle';
import { config, WhylogOptions } from './config';

const throttler = new LogThrottler();
let isHandlersAttached = false;
let reportFunc: any;

export function init(options?: WhylogOptions) {
  // 1. Update configuration (can be called multiple times)
  if (options) {
      config.update(options);
  }

  // 2. Attach handlers only once
  if (isHandlersAttached) {
      if (config.get().debug) console.log('[whylog] Init called but handlers already attached.');
      return;
  }
  isHandlersAttached = true;
  if (config.get().debug) console.log('[whylog] Initializing and attaching listeners...');

  // 3. Setup Error Bus
  bus.on(async (error, type) => {
    // Chaos Management: Throttle functionality
    if (config.get().throttle?.enabled && !throttler.shouldLog()) return;

    // Lazy load reporter
    if (!reportFunc) {
      try {
        const mod = require('../reporters/pretty');
        reportFunc = mod.report;
      } catch (e) {
        console.error('[whylog] Failed to load reporter:', e);
        console.error(error); // Fallback
        return;
      }
    }

    // Safe Reporter Execution
    if (config.get().safeReporter) {
        try {
            await reportFunc(error, type);
        } catch (reporterError) {
             console.error('[whylog] Reporter crashed:', reporterError);
             console.error(error); // Fallback to raw error
        }
    } else {
        await reportFunc(error, type);
    }

    // Exit Handling
    // In serverless or prod, we might not want to delay exit.
    // In dev, we might want to ensure logs flush.
    const isFatal = type === 'error' || type === 'unhandledRejection';
    
    if (typeof process !== 'undefined' && isFatal) {
        const conf = config.get();
        // Determine if we should block/delay exit
        const shouldDelay = conf.exit?.blockInDev && !config.isProduction && !config.isServerless;
        
        if (shouldDelay) {
            setTimeout(() => process.exit(1), conf.exit?.delayMs || 500);
        } else {
            process.exit(1);
        }
    }
  });

  // 4. Attach Platform Listeners
  attachListeners();
}

// Legacy alias for internal backward compatibility if needed, 
// but we should update usages to call init
export const bootstrap = () => init();
