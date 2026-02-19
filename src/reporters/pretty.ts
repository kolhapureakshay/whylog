import { parseStack } from '../parsers/stack';
import { HeuristicMapper } from '../core/heuristics';
import { getEnvInfo } from '../platform/env';
import { getStyle, Style, StyleOptions } from './style';
import { config, ConfigManager } from '../core/config'; // Import config singleton
import * as path from 'path';

// Deprecate internal globalOptions in favor of ConfigManager
export function configure(options: any) {
  ConfigManager.getInstance().update(options);
}

export async function report(error: Error, type: string) {
  const options = config.get(); // Use centralized config
  const env = getEnvInfo();
  const isProduction = ConfigManager.getInstance().isProduction;

  // Resolve format
  let format = options.format;
  if (format === 'auto' || !format) {
      format = isProduction ? 'json' : 'pretty';
  }

  // JSON or Production Mode (Fast Path)
  if (format === 'json') {
      reportJson(error, type, options, env, isProduction);
      return;
  }

  // Determine style (ANSI vs Plain)
  const styles = getStyle(format === 'plain' ? { ...options, color: false } : options);

  if (env.runtime === 'Node') {
    // Cast format back for reportNode specific logic if needed, or pass derived 'isPlain'
    await reportNode(error, type, { ...options, format } as any, styles, isProduction);
  } else {
    reportBrowser(error, type, options, styles);
  }
}

function reportJson(error: Error, type: string, options: any, env: any, isProd: boolean) {
  const frames = parseStack(error.stack || '');
  const insight = HeuristicMapper.getInsight(error, type);
  
  const fingerprint = generateFingerprint(error, frames[0]);

  const output = {
      timestamp: new Date().toISOString(),
      level: type === 'warning' ? 'warning' : 'error',
      severity: type === 'warning' ? 'WARNING' : (isProd ? 'CRITICAL' : 'ERROR'),
      category: insight.type,
      message: error.message,
      explanation: insight.why,
      heuristicId: insight.type,
      fingerprint: fingerprint,
      fix: insight.fix,
      location: frames[0] ? `${frames[0].file}:${frames[0].line}:${frames[0].col}` : null,
      stack: (options.simple || isProd) ? undefined : frames.map(f => `${f.fn} (${f.file}:${f.line})`),
      environment: (options.simple || isProd) ? undefined : {
          ...env,
          node: process.version
      }
  };

  console.log(JSON.stringify(output));
}

// ... imports ...

async function reportNode(error: Error, type: string, options: any, theme: Style, isProd: boolean) {
  const allFrames = parseStack(error.stack || '');
  
  // 1. Find the first user frame (not internal/node)
  // If all are internal (e.g. core crash), fallback to 0
  let topFrame = allFrames.find(f => !f.isInternal);
  if (!topFrame) topFrame = allFrames[0];

  const insight = HeuristicMapper.getInsight(error, type);
  const isPlain = options.format === 'plain';

  // Dynamic require to avoid bundling fs
  let fs;
  try { fs = require('fs'); } catch (e) {}

  // PRODUCTION / MINIMAL MODE
  if (isProd) {
    // Synchronous, minimal logging for prod
    const loc = topFrame ? `${topFrame.file}:${topFrame.line}:${topFrame.col}` : 'unknown';
    // No ANSI codes for production unless explicitly enabled via style/theme? 
    // Usually prod logs are ingested by tools that might want JSON, or plain text.
    // If format=json, we handled it in reportJson.
    // Here we are in formatted mode but 'prod'. 
    // User requested: "Minimal text format... ERROR: Cannot find module... at ..."
    // And "keep logging synchronous"
    
    // We'll use console.error which is sync in Node usually (to stderr).
    console.error(`ERROR: ${error.message}`);
    console.error(`at ${loc}`);
    console.error(`Why: ${insight.why}`);
    return;
  }

  // DEVELOPMENT / PRETTY MODE
  console.log('\n──────\n');
  
  // ... (existing pretty print logic with theme) ...
  // 1. ❌ CATEGORY: Message
  const isWarning = type === 'warning';
  const icon = isPlain ? (isWarning ? '[!]' : '[X]') : (isWarning ? '⚠️' : '❌');
  
  let categoryHeader = ` ${icon} ${insight.type.toUpperCase()}: `; 
  
  // Sanitize message to remove absolute paths AND "Require stack"
  let cleanMessage = error.message;
  
  // Remove "Require stack" block often added by Node internal modules
  cleanMessage = cleanMessage.replace(/Require stack:[\s\S]*/, '').trim();

  // ... (root replacement logic)


  if (options.projectRoot) {
      // Create a regex that matches the project root (handling backslashes for Windows)
      // Escape special regex chars in root path
      let root = options.projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      const rootRegex = new RegExp(root, 'gi'); 
      cleanMessage = cleanMessage.replace(rootRegex, '.');
  }

  if (isWarning) {
     console.log(`${theme.bgYellow(theme.black(categoryHeader))} ${theme.bold(cleanMessage)}`);
  } else {
     console.log(`${theme.bgRed(categoryHeader)} ${theme.bold(cleanMessage)}`);
  }
  
  // 2. 📍 LOCATION
  if (topFrame) {
      const relPath = options.projectRoot ? path.relative(options.projectRoot, topFrame.file) : topFrame.file;
      const locIcon = isPlain ? 'LOCATION:' : '📍 Location:';
      console.log(`\n ${theme.bold(locIcon)}`);
      // Force relative path if it's absolute and inside projectRoot? 
      // path.relative should handle it. 
      // If file is G:\projects\whylog\test-lab\module-error.js and root is G:\projects\whylog
      // result is test-lab\module-error.js
      console.log(` ${theme.main(`${relPath}:${topFrame.line}:${topFrame.col}`)}`);
  }

  // 3. 🧠 WHY
  const whyIcon = isPlain ? 'WHY:' : '🧠 Why:';
  console.log(`\n ${theme.bold(whyIcon)}`);
  console.log(` ${theme.main(insight.why)}`);

  // 4. 📄 SOURCE SNIPPET (Smart Gutter)
  if (topFrame && fs && fs.existsSync(topFrame.file)) {
    try {
      const content = fs.readFileSync(topFrame.file, 'utf8');
      const lines = content.split('\n');
      const start = Math.max(0, topFrame.line - 3);
      const end = Math.min(lines.length, topFrame.line + 2);

      const srcIcon = isPlain ? 'SOURCE:' : '📄 Source:';
      console.log(`\n ${theme.bold(srcIcon)}`);

      for (let i = start; i < end; i++) {
        const isTarget = i === topFrame.line - 1;
        const lineNum = String(i + 1).padStart(4, ' ');
        let lineContent = lines[i];
        
        // Filter out full-line comments for cleaner view, unless it's the target line
        if (!isTarget && lineContent.trim().startsWith('//')) {
             lineContent = ''; // Blank out comment lines
        }

        if (isTarget) {
          const gutter = theme.red('>'); 
          console.log(` ${gutter} ${theme.dim(lineNum)} | ${theme.main(lineContent)}`);
        } else {
          // If we blanked it out, printing empty string
          console.log(`   ${theme.dim(lineNum)} | ${theme.dim(lineContent)}`);
        }
      }
    } catch (e) {}
  }

  // 5. 💡 HOW TO FIX
  if (insight.fix.length > 0) {
      const fixIcon = isPlain ? 'HOW TO FIX:' : '💡 How to Fix:';
      console.log(`\n ${theme.bold(fixIcon)}`);
      insight.fix.forEach(step => console.log(` • ${theme.main(step)}`));
  }

  // 6. 🪵 STACK (Collapsed & Filtered)
  // Hide stack for warnings unless verbose option is set (assuming options.verbose exists or we add it)
  // For now, strict hide for warnings as per plan "Hide Stack for Warnings (unless verbose)"
  // We can treat `options.verbose` as truthy if passed.
  const showStack = !options.simple && allFrames.length > 0 && (!isWarning || options.verbose);
  
  if (showStack) { 
      const stackIcon = isPlain ? 'STACK:' : '🪵 Stack:';
      console.log(`\n ${theme.bold(stackIcon)}`);
      
      const framesToShow = allFrames.filter(f => !f.isInternal); // Filter internal by default in dev too?
      // User request: "hide internal frames by default, allow verbose mode".
      // We don't have verbose option explicitly passed here yet, assume default hides.
      // If no user frames, show all?
      const visibleFrames = framesToShow.length > 0 ? framesToShow : allFrames;
      
      let collapseCount = 0;
      let lastFrameSig = '';

      for (let i = 0; i < Math.min(visibleFrames.length, 15); i++) {
          const f = visibleFrames[i];
          const relPath = options.projectRoot ? path.relative(options.projectRoot, f.file) : f.file;
          const sig = `${f.fn} (${relPath})`;

          if (sig === lastFrameSig) {
              collapseCount++;
          } else {
              if (collapseCount > 0) {
                  const repeatMsg = isPlain ? `   (repeated ${collapseCount} times)` : `   ↺ repeated ${collapseCount} times`;
                  console.log(` ${theme.dim(repeatMsg)}`);
              }
              console.log(` ${theme.dim(`${f.fn} (${relPath}:${f.line}:${f.col})`)}`);
              collapseCount = 0;
              lastFrameSig = sig;
          }
      }
      if (collapseCount > 0) {
          const repeatMsg = isPlain ? `   (repeated ${collapseCount} times)` : `   ↺ repeated ${collapseCount} times`;
          console.log(` ${theme.dim(repeatMsg)}`);
      }
      
      const hiddenCount = allFrames.length - visibleFrames.length;
      if (hiddenCount > 0) {
          console.log(` ${theme.dim(`... ${hiddenCount} internal frames hidden`)}`);
      }
  }
  
  // ... environment ...

  
  // 7. ⚙ ENVIRONMENT
  if (!options.simple && !isProd) {
    // Try to read package.json version
    let pkgVersion = '';
    try {
        if (options.projectRoot) {
            const pkg = require(path.join(options.projectRoot, 'package.json'));
            pkgVersion = ` • ${pkg.name}@${pkg.version}`;
        }
    } catch(e) {}

    let osName = getEnvInfo().os;
    if (osName.startsWith('Windows_NT')) osName = 'Windows';

    const envSnapshot = [
        `Node ${process.version}`,
        osName,
        `${getEnvInfo().arch}${pkgVersion}`
    ].join(' • ');

    const envIcon = isPlain ? 'ENVIRONMENT:' : '⚙ Environment:';
    console.log(`\n ${theme.bold(envIcon)}`);
    console.log(` ${theme.dim(envSnapshot)}`);
  }

  console.log('\n');
}

function reportBrowser(error: Error, type: string, options: any, theme: Style) {
  // Browser implementation remains mostly same, maybe update for config if needed
  // ... (previous browser logic)
  // For brevity, using previous implementation but with config options check if needed
  const insight = HeuristicMapper.getInsight(error, type);
  const isPlain = options.format === 'plain';
  
  if (isPlain) {
      console.error(`[${insight.type.toUpperCase()}] ${error.message}`);
      console.log(`WHY: ${insight.why}`);
      if (insight.fix.length) console.log(`FIX: ${insight.fix.join('; ')}`);
      return;
  }

  const headerStyle = 'background: #e00; color: white; font-weight: bold; padding: 2px 4px; border-radius: 2px;';
  const labelStyle = 'font-weight: bold; color: #444;';
  const textStyle = 'color: #333;';

  console.group(`%c${insight.type.toUpperCase()}%c ${error.message}`, headerStyle, 'font-weight: bold; margin-left: 5px;');
  
  console.log(`%c🧠 Why:`, labelStyle);
  console.log(`%c${insight.why}`, textStyle);

  if (insight.fix.length > 0) {
      console.log(`%c💡 How to Fix:`, labelStyle);
      insight.fix.forEach(step => console.log(`%c• ${step}`, textStyle));
  }
  
  if (!options.simple) {
      console.log(`%c⚙ Environment:`, labelStyle);
      const env = getEnvInfo();
      console.log(`%c${env.runtime} (${env.agent})`, 'color: #888');
      
      console.error(error); 
  }

  console.groupEnd(); 
}

function generateFingerprint(error: Error, topFrame: any): string {
  const str = `${error.name}|${error.message}|${topFrame ? `${topFrame.file}:${topFrame.line}` : ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}
