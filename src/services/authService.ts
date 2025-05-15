import { auth } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { AUTH_CONFIG } from '@/config/auth.config';

interface LoginResponse {
  status: string;
  mensagem?: string;
  token?: string;
  refreshToken?: string;
  instancia?: string;
  nome?: string;
  telefone?: string;
  foto?: string;
  role?: string;
}

export const authService = {
  async postInstanceWebhook(data: { username: string; password: string; instancia: string }) {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
        'X-Key-Type': AUTH_CONFIG.KEY_TYPE
      };

      // Adiciona o token de autenticação se existir
      const token = auth.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${AUTH_CONFIG.API_URL}/instancia`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar dados para o webhook');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro no webhook:', error);
      throw error;
    }
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const sanitizedPayload = {
        username: sanitizeInput(username),
        password // A senha não é sanitizada, mas será hasheada no servidor
      };

      const response = await fetch(`${AUTH_CONFIG.API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE,
          'Accept': 'application/json'
        },
        credentials: 'include', // Inclui cookies na requisição
        body: JSON.stringify(sanitizedPayload)
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await response.json();

      // Se o login for bem-sucedido, configura a sessão
      if (data.status === 'success' && data.token && data.refreshToken) {
        auth.setSession(data.token, data.refreshToken);
      }

      return data;
    } catch (error) {
      console.error("Erro no login:", error);
      return {
        status: "error",
        mensagem: "Erro ao conectar com o servidor"
      };
    }
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${AUTH_CONFIG.API_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Falha ao renovar o token');
      }

      const data = await response.json();

      if (data.status === 'success' && data.token && data.refreshToken) {
        auth.setSession(data.token, data.refreshToken);
      }

      return data;
    } catch (error) {
      console.error("Erro ao renovar o token:", error);
      return {
        status: "error",
        mensagem: "Erro ao renovar a sessão"
      };
    }
  },

  async logout(): Promise<void> {
    const token = auth.getToken();
    if (token) {
      try {
        await fetch(`${AUTH_CONFIG.API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
            'X-Key-Type': AUTH_CONFIG.KEY_TYPE
          }
        });
      } catch (error) {
        console.error("Erro ao fazer logout no servidor:", error);
      }
    }
    auth.logout();
  }
};
