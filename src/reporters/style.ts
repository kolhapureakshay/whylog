export interface Style {
  dim: (t: string) => string;
  red: (t: string) => string;
  bold: (t: string) => string;
  bgRed: (t: string) => string;
  bgYellow: (t: string) => string;
  black: (t: string) => string;
  main: (t: string) => string;
  accent: (t: string) => string;
}

export interface StyleOptions {
  color?: boolean | 'auto';
  theme?: 'light' | 'dark';
}

const NO_COLOR: Style = {
  dim: (t) => t,
  red: (t) => t,
  bold: (t) => t,
  bgRed: (t) => t,
  bgYellow: (t) => t,
  black: (t) => t,
  main: (t) => t,
  accent: (t) => t,
};

const ANSI_DARK: Style = {
  dim: (t) => `\x1b[90m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  bgRed: (t) => `\x1b[41m\x1b[37m${t}\x1b[0m`,
  bgYellow: (t) => `\x1b[43m${t}\x1b[0m`,
  black: (t) => `\x1b[30m${t}\x1b[0m`,
  main: (t) => `\x1b[37m${t}\x1b[0m`,
  accent: (t) => `\x1b[36m${t}\x1b[0m`,
};

const ANSI_LIGHT: Style = {
  dim: (t) => `\x1b[90m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  bgRed: (t) => `\x1b[41m\x1b[37m${t}\x1b[0m`,
  bgYellow: (t) => `\x1b[43m${t}\x1b[0m`,
  black: (t) => `\x1b[30m${t}\x1b[0m`,
  main: (t) => `\x1b[30m${t}\x1b[0m`,
  accent: (t) => `\x1b[34m${t}\x1b[0m`,
};

export function getStyle(options: StyleOptions = {}): Style {
  // 1. Env override
  if (process.env.WHYLOG_COLOR === 'false') return NO_COLOR;
  if (process.env.WHYLOG_COLOR === 'true') return options.theme === 'light' ? ANSI_LIGHT : ANSI_DARK;

  // 2. Explicit config
  if (options.color === false) return NO_COLOR;
  
  // 3. Auto detection (Default)
  // If color is 'auto' or undefined, check TTY
  const isTTY = process.stdout && process.stdout.isTTY;
  if (!isTTY && options.color !== true) return NO_COLOR;

  return options.theme === 'light' ? ANSI_LIGHT : ANSI_DARK;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
