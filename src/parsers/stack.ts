export interface StackFrame {
  file: string;
  line: number;
  col: number;
  fn: string;
  isInternal: boolean; 
}

export function parseStack(stack: string): StackFrame[] {
  // Remove "Error: ..." header
  const lines = stack.split('\n').filter(l => l.trim().startsWith('at '));
  const frames: StackFrame[] = [];

  for (const line of lines) {
    // Basic V8 stack line regex
    // at func (file:line:col) 
    // at file:line:col
    const match = line.match(/^\s*at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?$/);
    
    // Async stack traces or other formats might differ, but this covers standard V8
    if (match) {
      const fn = match[1] || '<anonymous>';
      let rawFile = match[2];
      const lineNum = parseInt(match[3], 10);
      const colNum = parseInt(match[4], 10);

      // Handle file:// URLs (common in Node ESM)
      if (rawFile.startsWith('file://')) {
          try {
              // Attempt to use Node's URL module if available (Node environment)
              // We use dynamic require to avoid breaking browser builds/bundlers that don't polyfill 'url'
              const { fileURLToPath } = require('url');
              rawFile = fileURLToPath(rawFile);
          } catch (e) {
              // Fallback for non-Node environments: strict URL check using global URL if present
              try {
                 const u = new URL(rawFile);
                 rawFile = u.pathname;
              } catch (e2) {
                 // Final fallback: just strip protocol key
                 rawFile = rawFile.replace(/^file:\/\//, '');
              }
          }
      }
      
      const isInternal = 
          rawFile.startsWith('node:') || 
          rawFile.includes('node_modules') || 
          rawFile.startsWith('internal/') ||
          (!rawFile.includes('/') && !rawFile.includes('\\')); // Core modules like 'fs.js' (old node) or just 'fs'

      frames.push({
        fn,
        file: rawFile,
        line: lineNum,
        col: colNum,
        isInternal
      });
    }
  }

  return frames;
}
