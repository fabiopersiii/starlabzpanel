import { auth } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

interface LoginResponse {
  status: string;
  mensagem?: string;
  token?: string;
  refreshToken?: string;
  instancia?: string;
  nome?: string;
  telefone?: string;
  foto?: string;
}

export const authService = {
  async postInstanceWebhook(data: { username: string; password: string; instancia: string }) {
    try {
      // Token JWT fixo
      const jwtToken = 'toxxth-jmqes-0xacTa';

      const response = await fetch('https://webhook.dpscloud.online/webhook/instancia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
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
      // Token JWT fixo conforme configuração
      const jwtToken = 'toxxth-jmqes-0xacTa';

      const sanitizedPayload = {
        username: sanitizeInput(username),
        password // A senha não é sanitizada, mas será hasheada no servidor
      };

      const response = await fetch('https://webhook.dpscloud.online/webhook/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(sanitizedPayload)
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await response.json();

      // Se o login for bem-sucedido, configura a sessão
      if (data.mensagem === "Login efetuado com sucesso!") {
        // Usa o token JWT fixo como token de sessão
        auth.setSession(jwtToken, data.refreshToken || '');
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

  async logout(): Promise<void> {
    auth.logout();
  }
};
