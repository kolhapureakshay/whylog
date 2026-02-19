import * as os from 'os';

export interface EnvInfo {
  runtime: 'Node' | 'Browser' | 'Unknown';
  version: string;
  os: string;
  arch: string;
  agent?: string;
}

export function getEnvInfo(): EnvInfo {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return {
      runtime: 'Node',
      version: process.version,
      os: `${os.type()} ${os.release()}`,
      arch: process.arch
    };
  } else if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    return {
      runtime: 'Browser',
      version: 'N/A', // Browser version usually in UA
      os: navigator.platform,
      arch: 'unknown',
      agent: navigator.userAgent
    };
  } else {
    return {
      runtime: 'Unknown',
      version: 'unknown',
      os: 'unknown',
      arch: 'unknown'
    };
  }
}
