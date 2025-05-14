import { createClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

interface JwtPayload {
  exp: number;
  sub: string;
  role: string;
  sessionId: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

class Auth {
  private static instance: Auth;
  private state: AuthState = {
    token: null,
    refreshToken: null,
    expiresAt: null
  };
  private refreshTimeout: NodeJS.Timeout | null = null;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly SESSION_TIMEOUT = 1000 * 60 * 60 * 24; // 24 horas
  private readonly REFRESH_THRESHOLD = 1000 * 60 * 5; // 5 minutos antes de expirar

  private constructor() {
    this.initializeFromStorage();
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

    if (token) {
      this.state.token = token;
      this.state.refreshToken = refreshToken;
      this.verifyAndRefreshToken();
    }
  }

  private saveToStorage() {
    if (this.state.token) {
      localStorage.setItem(this.TOKEN_KEY, this.state.token);
      if (this.state.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, this.state.refreshToken);
      }
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    return this.getToken() !== null;
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.role;
    } catch {
      return null;
    }
  }

  hasRole(requiredRole: string): boolean {
    const userRole = this.getUserRole();
    return userRole === requiredRole;
  }

  logout() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.state = {
      token: null,
      refreshToken: null,
      expiresAt: null
    };
    this.saveToStorage();
    toast.info('Você foi desconectado');
  }
}

export const auth = Auth.getInstance();
