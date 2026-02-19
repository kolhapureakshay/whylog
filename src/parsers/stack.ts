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
      const rawFile = match[2];
      const lineNum = parseInt(match[3], 10);
      const colNum = parseInt(match[4], 10);
      
      const isInternal = 
          rawFile.startsWith('node:') || 
          rawFile.includes('node_modules') || 
          rawFile.startsWith('internal/') ||
          !rawFile.includes('/') && !rawFile.includes('\\'); // Core modules like 'fs.js' (old node) or just 'fs'

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
