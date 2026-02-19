import { Context, globalContext } from './context';
import { StyleOptions } from '../reporters/style';

export interface WhylogOptions extends StyleOptions {
  mode?: 'auto' | 'dev' | 'prod';
  ignore?: (string | RegExp)[] | ((error: Error) => boolean);
  format?: 'pretty' | 'plain' | 'json' | 'auto';
  simple?: boolean; // Legacy alias for plain/compact views or just hiding stack
  projectRoot?: string;
  serverless?: 'auto' | boolean;
  showWarnings?: boolean; // Default true
  dedupe?: boolean; // Default true
  throttle?: {
      enabled: boolean;
      windowMs: number;
      max: number;
  };
  exit?: {
      blockInDev: boolean;
      delayMs: number;
  };
  safeReporter?: boolean; // Wrap reporter in try/catch to prevent crashes
  debug?: boolean; // Enable internal debug logging
}

export class ConfigManager {
  private static instance: ConfigManager;
  private options: WhylogOptions = {
    mode: 'auto',
    ignore: [],
    format: 'auto' as any, 
    color: 'auto',
    theme: 'dark',
    projectRoot: process.cwd(),
    serverless: 'auto',
    showWarnings: true,
    dedupe: true,
    throttle: {
        enabled: true,
        windowMs: 1000,
        max: 5
    },
    exit: {
        blockInDev: true,
        delayMs: 500
    },
    safeReporter: true
  };

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
      ConfigManager.instance.loadEnv();
    }
    return ConfigManager.instance;
  }

  private loadEnv() {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.WHYLOG_FORMAT) {
         this.options.format = process.env.WHYLOG_FORMAT as any;
      }
      if (process.env.WHYLOG_COLOR === 'false') this.options.color = false;
      if (process.env.WHYLOG_COLOR === 'true') this.options.color = true;
      if (process.env.WHYLOG_MODE) this.options.mode = process.env.WHYLOG_MODE as any;
      
      // Serverless Detection
      if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL || process.env.FUNCTIONS_WORKER_RUNTIME) {
          this.options.serverless = true;
      }
    }
  }

  update(options: WhylogOptions) {
    this.options = { ...this.options, ...options };
    
    // Auto-resolve serverless if set to auto
    if (this.options.serverless === 'auto') {
        if (typeof process !== 'undefined' && (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL || process.env.FUNCTIONS_WORKER_RUNTIME)) {
            this.options.serverless = true;
        } else {
            this.options.serverless = false;
        }
    }
  }

  get() {
    return this.options;
  }

  // Derived properties
  get isProduction(): boolean {
    if (this.options.mode === 'prod') return true;
    if (this.options.mode === 'dev') return false;
    return globalContext.env === 'production';
  }

  get isServerless(): boolean {
      return this.options.serverless === true;
  }

  shouldIgnored(error: Error): boolean {
    if (!this.options.ignore) return false;
    
    if (typeof this.options.ignore === 'function') {
        return this.options.ignore(error);
    }

    if (this.options.ignore.length === 0) return false;
    
    const msg = error.message || '';
    const name = error.name || ''; // Some errors might not have message

    return this.options.ignore.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(msg) || pattern.test(name);
      }
      return msg.includes(pattern) || name.includes(pattern);
    });
  }
}

export const config = ConfigManager.getInstance();
