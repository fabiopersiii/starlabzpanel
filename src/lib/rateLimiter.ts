class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();
  private readonly limit: number;
  private readonly interval: number = 60000; // 1 minuto em milissegundos

  constructor() {
    this.limit = Number(import.meta.env.VITE_RATE_LIMIT) || 60;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    
    if (now - this.lastReset >= this.interval) {
      this.requests = 0;
      this.lastReset = now;
    }

    if (this.requests >= this.limit) {
      return false;
    }

    this.requests++;
    return true;
  }

  getRemainingRequests(): number {
    return Math.max(0, this.limit - this.requests);
  }

  getTimeToReset(): number {
    return Math.max(0, this.interval - (Date.now() - this.lastReset));
  }
}

export const rateLimiter = new RateLimiter();
