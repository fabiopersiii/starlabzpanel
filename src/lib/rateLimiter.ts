import { SECURITY_CONFIG } from './securityConfig';
import { toast } from 'sonner';

interface RateLimitEntry {
  requests: number;
  lastReset: number;
  blocked: boolean;
  blockedUntil?: number;
  loginAttempts?: number;
  lastLoginAttempt?: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private readonly limits: Map<string, RateLimitEntry> = new Map();
  private readonly config = SECURITY_CONFIG.rateLimit;
  private readonly authConfig = SECURITY_CONFIG.auth;

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private getEntry(identifier: string): RateLimitEntry {
    if (!this.limits.has(identifier)) {
      this.limits.set(identifier, {
        requests: 0,
        lastReset: Date.now(),
        blocked: false,
        loginAttempts: 0
      });
    }
    return this.limits.get(identifier)!;
  }

  private resetEntry(identifier: string): void {
    const entry = this.getEntry(identifier);
    entry.requests = 0;
    entry.lastReset = Date.now();
    
    if (entry.blocked && entry.blockedUntil && Date.now() >= entry.blockedUntil) {
      entry.blocked = false;
      entry.blockedUntil = undefined;
    }
  }

  canMakeRequest(identifier: string): boolean {
    const entry = this.getEntry(identifier);
    const now = Date.now();

    // Verifica se o bloqueio deve ser removido
    if (entry.blocked && entry.blockedUntil && now >= entry.blockedUntil) {
      entry.blocked = false;
      entry.blockedUntil = undefined;
      entry.loginAttempts = 0;
    }

    // Se estiver bloqueado, retorna falso
    if (entry.blocked) {
      const timeLeft = entry.blockedUntil ? Math.ceil((entry.blockedUntil - now) / 1000) : 0;
      toast.error(`Acesso bloqueado. Tente novamente em ${timeLeft} segundos.`);
      return false;
    }

    // Reseta contadores se o intervalo passou
    if (now - entry.lastReset >= this.config.windowMs) {
      this.resetEntry(identifier);
    }

    // Verifica limite de requisições
    if (entry.requests >= this.config.max) {
      entry.blocked = true;
      entry.blockedUntil = now + this.authConfig.LOCKOUT_DURATION;
      toast.error(this.config.message);
      return false;
    }

    entry.requests++;
    return true;
  }

  trackLoginAttempt(identifier: string, success: boolean): boolean {
    const entry = this.getEntry(identifier);
    const now = Date.now();

    // Reseta tentativas se passou muito tempo desde a última
    if (entry.lastLoginAttempt && (now - entry.lastLoginAttempt > this.authConfig.LOCKOUT_DURATION)) {
      entry.loginAttempts = 0;
    }

    entry.lastLoginAttempt = now;

    if (success) {
      entry.loginAttempts = 0;
      return true;
    }

    entry.loginAttempts = (entry.loginAttempts || 0) + 1;

    if (entry.loginAttempts >= this.authConfig.MAX_LOGIN_ATTEMPTS) {
      entry.blocked = true;
      entry.blockedUntil = now + this.authConfig.LOCKOUT_DURATION;
      toast.error(`Conta bloqueada por ${this.authConfig.LOCKOUT_DURATION / 60000} minutos devido a muitas tentativas de login.`);
      return false;
    }

    toast.error(`Tentativa de login falhou. ${this.authConfig.MAX_LOGIN_ATTEMPTS - entry.loginAttempts} tentativas restantes.`);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.getEntry(identifier);
    return Math.max(0, this.config.max - entry.requests);
  }

  getTimeToReset(identifier: string): number {
    const entry = this.getEntry(identifier);
    return Math.max(0, this.config.windowMs - (Date.now() - entry.lastReset));
  }
}

export const rateLimiter = RateLimiter.getInstance();
