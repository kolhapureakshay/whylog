export interface Context {
  env: 'development' | 'production';
  runtime: 'node' | 'browser';
  platform: string;
  isLambda: boolean;
  projectRoot: string;
  isTTY: boolean;
}

export function detectContext(): Context {
  const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  
  // Default values
  let env: 'development' | 'production' = 'development';
  let platform = 'unknown';
  let isLambda = false;
  let projectRoot = '/';
  let isTTY = false;

  if (isNode) {
    // NODE_ENV check
    if (process.env.NODE_ENV === 'production') {
      env = 'production';
    }

    // Platform
    platform = process.platform;

    // Lambda check
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      isLambda = true;
      env = 'production'; // Force production in Lambda usually
    }

    // CWD
    projectRoot = process.cwd();

    // TTY
    isTTY = process.stdout && process.stdout.isTTY;
  } else if (isBrowser) {
    platform = navigator.platform;
    // Browser usually implies 'production' build unless explicitly locally serving? 
    // Actually, dev tools are often open. Let's default to dev unless we detect otherwise,
    // or maybe valid 'production' signals in browser are hard without build tool injection.
    // We'll leave as 'development' default unless explicitly configured.
  }

  return {
    env,
    runtime: isNode ? 'node' : 'browser',
    platform,
    isLambda,
    projectRoot,
    isTTY
  };
}

export const globalContext = detectContext();
