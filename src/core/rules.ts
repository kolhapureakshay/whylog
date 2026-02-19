export interface Rule {
  id: string; // Unique ID (e.g., 'fs-enoent')
  title: string; // Short title (e.g., 'File Not Found')
  category: 'Error' | 'Warning' | 'Info' | string;
  pattern: (error: any, eventType?: string) => boolean;
  explanation: (error: any) => string;
  fix: (error: any) => string[];
  priority?: number; // Higher matches first
}

export const rules: Rule[] = [
  // --- MEMORY / RECURSION ---
  {
    id: 'recursion-limit',
    title: 'Recursion Limit Exceeded',
    category: 'Recursion Error',
    priority: 100,
    pattern: (err) => 
      (err.name === 'RangeError' || (err.message && err.message.includes('Maximum call stack size exceeded'))) && 
      (err.stack && err.stack.includes('stack')),
    explanation: () => 'The application is stuck in an infinite loop of function calls (recursion), consuming all available stack memory.',
    fix: () => [
      'Check your recursive functions for a base case (exit condition).',
      'Ensure your recursive calls are actually moving towards the base case.',
      'Look for accidental circular calls between two functions.'
    ]
  },

  // --- ASYNC / PROMISE ---
  {
    id: 'unhandled-rejection',
    title: 'Unhandled Rejection',
    category: 'Async Error',
    priority: 90,
    pattern: (err, type) => type === 'unhandledRejection',
    explanation: () => 'A Promise was rejected, but there was no `.catch()` handler to handle the error. This can crash the process in newer Node versions.',
    fix: () => [
      'Add a `.catch(err => ...)` to the promise chain.',
      'Wrap `await` calls in a `try/catch` block.',
      'Ensure you are returning promises correctly in async functions.'
    ]
  },

  // --- WARNINGS ---
  {
      id: 'node-warning',
      title: 'Process Warning',
      category: 'Warning',
      priority: 50,
      pattern: (err, type) => type === 'warning',
      explanation: (err) => `Node.js process emitted a warning: ${err.message}`,
      fix: () => [
          'Check the warning details.',
          'Update dependencies if deprecated features are used.',
          'Use `node --trace-warnings` to see where it comes from.'
      ]
  },

  // --- MODULE SYSTEM ---
  {
    id: 'json-parse',
    title: 'JSON Parse Error',
    category: 'Syntax Error',
    priority: 90,
    pattern: (err) => err instanceof SyntaxError && err.message.includes('JSON'),
    explanation: (err) => `Failed to parse JSON. ${err.message}`,
    fix: () => [
        'Check for trailing commas (not allowed in standard JSON).',
        'Ensure keys are quoted with double quotes.',
        'Validate the JSON structure using an online validator.'
    ]
  },
  {
    id: 'module-not-found',
    title: 'Module Not Found',
    category: 'Import Error',
    priority: 85,
    pattern: (err) => err.code === 'MODULE_NOT_FOUND' || (err.message && err.message.includes('Cannot find module')),
    explanation: (err) => {
        const match = err.message.match(/Cannot find module '(.+?)'/);
        const moduleName = match ? match[1] : 'dependency';
        return `The module \`${moduleName}\` could not be resolved.`;
    },
    fix: (err) => {
        const match = err.message.match(/Cannot find module '(.+?)'/);
        const moduleName = match ? match[1] : 'dependency';
        if (moduleName.startsWith('/') || moduleName.startsWith('./') || moduleName.startsWith('../')) {
            return [
                'Check the file path for typos.',
                'Ensure the file extension is correct (or supported).',
                'Verify the file exists on disk.'
            ];
        }
        return [
            `Run \`npm install ${moduleName}\` to install the dependency.`,
            'Check your `package.json` dependencies.',
            'Ensure you are in the correct directory.'
        ];
    }
  },
  {
    id: 'import-outside-module',
    title: 'Module Error',
    category: 'Syntax Error',
    priority: 80,
    pattern: (err) => err.name === 'SyntaxError' && err.message && err.message.includes('Cannot use import statement outside a module'),
    explanation: () => 'Node.js encountered an ES6 `import` statement in a file it treats as CommonJS (legacy).',
    fix: () => [
      'Add `"type": "module"` to your `package.json`.',
      'Rename the file extension from `.js` to `.mjs`.',
      'Use a bundler (like Webpack, Rollup, or Vite) or `ts-node` to handle imports.'
    ]
  },

  // --- TYPE ERRORS ---
  {
    id: 'is-not-a-function',
    title: 'Type Error',
    category: 'Type Error',
    priority: 70,
    pattern: (err) => err.name === 'TypeError' && err.message && err.message.includes('is not a function'),
    explanation: (err) => {
      const match = err.message.match(/(.*) is not a function/);
      const variable = match ? match[1] : 'The variable';
      return `The code tried to call \`${variable}\` as a function, but it is not callable. It is likely \`undefined\`, \`null\`, or an object constraint.`;
    },
    fix: (err) => {
        const match = err.message.match(/(.*) is not a function/);
        const variable = match ? match[1] : 'variable';
        return [
            `Log \`console.log(${variable})\` before the call to verify its value.`,
            'Check if you are encountering a circular dependency (rendering imports as empty objects).',
            'Verify you are using the correct import type (default vs named import).'
        ];
    }
  },
  {
    id: 'cannot-read-property',
    title: 'Type Error',
    category: 'Type Error',
    priority: 70,
    pattern: (err) => err.name === 'TypeError' && err.message && (err.message.includes('Cannot read properties of undefined') || err.message.includes('Cannot read property')),
    explanation: () => 'The code tried to access a property on a value that is `undefined` or `null`.',
    fix: () => [
      'Use optional chaining (`?.`) to safely access nested properties.',
      'Add a guard clause (e.g., `if (!obj) return;`).',
      'Trace back where the object was supposed to be initialized.'
    ]
  },

  // --- FILESYSTEM ---
  {
    id: 'fs-enoent',
    title: 'File Not Found',
    category: 'FileSystem Error',
    priority: 60,
    pattern: (err) => err.code === 'ENOENT',
    explanation: () => 'The application tried to access a file or directory that does not exist.',
    fix: () => [
      'Check the file path for typos.',
      'Verify that the file actually exists on disk.',
      'Ensure usage of absolute vs relative paths is correct.'
    ]
  },
  {
    id: 'fs-eacces',
    title: 'Permission Denied',
    category: 'FileSystem Error',
    priority: 60,
    pattern: (err) => err.code === 'EACCES' || err.code === 'EPERM',
    explanation: () => 'The application tried to perform an operation (read/write/execute) but was denied permission.',
    fix: () => [
      'Check file locks.',
      'Run with higher privileges (sudo) if appropriate.',
      'Check file ownership (chmod).'
    ]
  },

  // --- NETWORK ---
  {
    id: 'net-eaddrinuse',
    title: 'Port In Use',
    category: 'Network Error',
    priority: 60,
    pattern: (err) => err.code === 'EADDRINUSE',
    explanation: () => 'The application tried to bind to a network port that is already in use.',
    fix: () => [
      'Change the port number.',
      'Kill the process using the port (`lsof -i :<port>`).',
      'Wait slightly if the port was recently closed.'
    ]
  },
  {
    id: 'net-econnrefused',
    title: 'Connection Refused',
    category: 'Network Error',
    priority: 60,
    pattern: (err) => err.code === 'ECONNREFUSED',
    explanation: () => 'The application tried to connect to a server, but the connection was refused.',
    fix: () => [
      'Check if the destination service is running.',
      'Verify hostname and port.',
      'Check firewall settings.'
    ]
  },
  
  // --- LOGIC ---
  {
    id: 'logic-reference',
    title: 'Reference Error',
    category: 'Logic Error',
    priority: 60,
    pattern: (err) => err.name === 'ReferenceError' && err.message && err.message.includes('is not defined'),
    explanation: (err) => {
        const variable = err.message.split(' ')[0];
        return `The code used variable '${variable}' which has not been declared.`;
    },
    fix: (err) => {
        const variable = err.message.split(' ')[0];
        return [
            `Define '${variable}' before use.`,
            'Check for typos.',
            'Ensure imports are correct.'
        ];
    }
  }
];

// Fallback rule
export const unknownRule: Rule = {
  id: 'unknown',
  title: 'Runtime Error',
  category: 'Error',
  pattern: () => true, // Match all
  explanation: () => 'No specific heuristic matched this error. It might be a generic runtime crash.',
  fix: () => [
    'Review the stack trace below.',
    'Use `console.log` to debug values leading up to the crash.'
  ]
};
