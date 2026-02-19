// src/core/throttle.ts

export class LogThrottler {
  private static WINDOW_MS = 1000;
  private static MAX_LOGS = 10;
  
  private logsRequest = 0;
  private windowStart = Date.now();
  private suppressed = false;

  shouldLog(): boolean {
      const now = Date.now();
      if (now - this.windowStart > LogThrottler.WINDOW_MS) {
          // Reset window
          this.windowStart = now;
          this.logsRequest = 0;
          this.suppressed = false;
          return true;
      }

      this.logsRequest++;

      if (this.logsRequest <= LogThrottler.MAX_LOGS) {
          return true;
      }

      if (!this.suppressed) {
          this.suppressed = true;
          console.error(`\n... [whylog] Throttling output: Too many errors in short time ...\n`);
      }
      
      return false;
  }
  
  reset() {
      this.logsRequest = 0;
      this.windowStart = Date.now();
      this.suppressed = false;
  }
}

export const throttler = new LogThrottler();
