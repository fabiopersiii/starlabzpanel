import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { AUTH_CONFIG } from '@/config/auth.config';

interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  role: string;
  sessionId: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  lastActivity: number | null; 
  role: string | null;
}

class Auth {
  private static instance: Auth;
  private state: AuthState = {
    token: null,
    refreshToken: null,
    expiresAt: null,
    lastActivity: null,
    role: null
  };
  private refreshTimeout: NodeJS.Timeout | null = null;
  private activityTimeout: NodeJS.Timeout | null = null;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly ROLE_KEY = 'auth_role';
  private readonly LAST_ACTIVITY_KEY = 'last_activity';
  private readonly SESSION_TIMEOUT = 1000 * 60 * 60 * 24; // 24 horas
  private readonly REFRESH_THRESHOLD = 1000 * 60 * 5; // 5 minutos antes de expirar
  private readonly INACTIVITY_TIMEOUT = 1000 * 60 * 30; // 30 minutos de inatividade

  private constructor() {
    this.initializeFromStorage();
    this.setupActivityMonitor();
  }

  static getInstance(): Auth {
    if (!Auth.instance) {
      Auth.instance = new Auth();
    }
    return Auth.instance;
  }

  private initializeFromStorage() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const role = localStorage.getItem(this.ROLE_KEY);
    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);

    if (token) {
      this.state = {
        token,
        refreshToken,
        role,
        lastActivity: lastActivity ? parseInt(lastActivity) : null,
        expiresAt: null
      };
      this.verifyAndRefreshToken();
    }
  }

  private saveToStorage() {
    if (this.state.token) {
      localStorage.setItem(this.TOKEN_KEY, this.state.token);
      if (this.state.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, this.state.refreshToken);
      }
      if (this.state.role) {
        localStorage.setItem(this.ROLE_KEY, this.state.role);
      }
      if (this.state.lastActivity) {
        localStorage.setItem(this.LAST_ACTIVITY_KEY, this.state.lastActivity.toString());
      }
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.ROLE_KEY);
      localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    }
  }

  private setupActivityMonitor() {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, () => this.updateLastActivity());
    });

    this.checkInactivity();
  }

  private updateLastActivity() {
    this.state.lastActivity = Date.now();
    this.saveToStorage();
  }

  private checkInactivity() {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.activityTimeout = setInterval(() => {
      if (!this.state.lastActivity) return;

      const inactiveTime = Date.now() - this.state.lastActivity;
      if (inactiveTime > this.INACTIVITY_TIMEOUT) {
        this.logout();
        toast.error('Sessão encerrada por inatividade');
      }
    }, 60000); // Verifica a cada minuto
  }

  private scheduleTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    if (!this.state.expiresAt) return;

    const timeToRefresh = this.state.expiresAt - Date.now() - this.REFRESH_THRESHOLD;
    if (timeToRefresh <= 0) {
      this.refreshToken();
      return;
    }

    this.refreshTimeout = setTimeout(() => this.refreshToken(), timeToRefresh);
  }

  private async refreshToken() {
    if (!this.state.refreshToken) {
      this.logout();
      return;
    }

    try {
      const response = await fetch(`${AUTH_CONFIG.API_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify({ refreshToken: this.state.refreshToken }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar o token');

      const { token, refreshToken } = await response.json();
      this.setSession(token, refreshToken);
    } catch (error) {
      this.logout();
      toast.error('Sua sessão expirou. Por favor, faça login novamente.');
    }
  }

  private verifyAndRefreshToken() {
    if (!this.state.token) return false;

    try {
      const decoded = jwtDecode<JwtPayload>(this.state.token);
      const expirationTime = decoded.exp * 1000;
      this.state.expiresAt = expirationTime;
      this.state.role = decoded.role;

      // Verifica se o token já expirou
      if (Date.now() >= expirationTime) {
        this.logout();
        return false;
      }

      // Verifica se está próximo de expirar
      if (expirationTime - Date.now() <= this.REFRESH_THRESHOLD) {
        this.refreshToken();
        return false;
      }

      this.scheduleTokenRefresh();
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  setSession(token: string, refreshToken: string) {
    this.state.token = token;
    this.state.refreshToken = refreshToken;
    this.updateLastActivity();
    this.saveToStorage();
    this.verifyAndRefreshToken();
  }

  getToken(): string | null {
    if (!this.verifyAndRefreshToken()) {
      return null;
    }
    return this.state.token;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Verifica tempo de inatividade
    const lastActivity = this.state.lastActivity;
    if (lastActivity && Date.now() - lastActivity > this.INACTIVITY_TIMEOUT) {
      this.logout();
      return false;
    }

    this.updateLastActivity();
    return true;
  }

  getUserRole(): string | null {
    return this.state.role;
  }

  hasRole(requiredRole: string): boolean {
    return this.state.role === requiredRole;
  }

  logout() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }
    this.state = {
      token: null,
      refreshToken: null,
      expiresAt: null,
      lastActivity: null,
      role: null
    };
    this.saveToStorage();
    toast.info('Você foi desconectado');
  }
}

export const auth = Auth.getInstance();
