import { EndpointUrls } from "@/hooks/useEndpoints";
import { auth } from "@/lib/auth";
import { AUTH_CONFIG } from "@/config/auth.config";

interface AuthPayload {
  username: string;
  password: string;
}

interface InstancePayload {
  instancia: string;
}

interface ApiResponse {
  status: string;
  mensagem?: string;
  instancia?: string;
  nome?: string;
  telefone?: string;
  foto?: string;
  token?: string;
}

// Simple input sanitization function to prevent XSS attacks
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

interface ConfigResponse {
  BaseUrl: string;
  Autenticacao: string;
  QrCode: string;
  Reinicializacao: string;
  Desconexao: string;
  Instancia: string;
  Status: string;
}

let endpoints: EndpointUrls;

// Configuração do ambiente
const API_URL = import.meta.env.VITE_API_URL || 'https://webhook.dpscloud.online/webhook';
const API_KEY = import.meta.env.VITE_API_KEY;
const IS_PROD = import.meta.env.VITE_NODE_ENV === 'production';

// Função para converter a resposta da API para o formato usado internamente
const convertConfigResponse = (config: ConfigResponse): EndpointUrls => ({
  base: config.BaseUrl,
  auth: config.Autenticacao,
  qrcode: config.QrCode,
  restart: config.Reinicializacao,
  disconnect: config.Desconexao,
  status: config.Status,
  instancia: config.Instancia
});

// Função para criptografar dados sensíveis
const encryptSensitiveData = (data: string): string => {
  return btoa(data); // Versão básica - em produção use uma criptografia mais robusta
};

const handleRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    throw new Error('Erro na requisição: ' + (error as Error).message);
  }
};

// Verifica se há conexão com a internet
const checkOnline = async (): Promise<boolean> => {
  try {
    await fetch('https://webhook.dpscloud.online/webhook/saas', { method: 'GET' });
    return true;
  } catch {
    return false;
  }
};

// Carrega os endpoints da API ou usa o cache do localStorage
const loadEndpoints = async (): Promise<EndpointUrls> => {
  try {
    const isOnline = await checkOnline();
    
    if (isOnline) {
      const response = await handleRequest(`${API_URL}/saas`);
      const data = await response.json();
      const config = convertConfigResponse(data[0]);
    
      if (!IS_PROD) {
        localStorage.setItem("starlabz_endpoints", JSON.stringify(config));
      }
      return config;
    }

    const saved = localStorage.getItem("starlabz_endpoints");
    if (saved) {
      return JSON.parse(saved);
    }
    
    throw new Error('Sem conexão e sem cache local');
  } catch (error) {
    console.error("Erro ao carregar endpoints:", error);
    return {
      base: API_URL,
      auth: "/auth",
      qrcode: "/qrcode",
      restart: "/restart",
      disconnect: "/disconnect",
      status: "/status",
      instancia: "/instancia"
    };
  }
};

// Inicializa os endpoints com valores padrão e depois carrega da API
endpoints = {
  base: API_URL,
  auth: "/auth",
  qrcode: "/qrcode",
  restart: "/restart",
  disconnect: "/disconnect",
  status: "/status",
  instancia: "/instancia"
};

// Carrega os endpoints da API ao inicializar
loadEndpoints().then(newEndpoints => {
  Object.assign(endpoints, newEndpoints);
});

// Função para obter a URL completa do endpoint
const getUrl = (endpoint: keyof Omit<EndpointUrls, "base">): string => {
  return `${endpoints.base}${endpoints[endpoint]}`;
};

export const apiService = {
  async login(payload: AuthPayload): Promise<ApiResponse> {
    try {
      const sanitizedPayload = {
        username: sanitizeInput(payload.username),
        password: payload.password // A senha não é sanitizada, mas será hasheada no servidor
      };
      
      const response = await fetch(getUrl('auth'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify(sanitizedPayload)
      });
      
      const data = await response.json();
      
      if (data.token && data.refreshToken) {
        auth.setSession(data.token, data.refreshToken);
      }
      
      return data;
    } catch (error) {
      console.error("Erro no login:", error);
      return { status: "error", mensagem: "Erro ao conectar com o servidor" };
    }
  },
  
  async generateQRCode(payload: InstancePayload): Promise<ApiResponse> {
    if (!auth.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await fetch(getUrl('qrcode'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao gerar QR code:", error);
      return { status: "error", mensagem: "Erro ao gerar QR code" };
    }
  },
  
  async restartInstance(payload: InstancePayload): Promise<ApiResponse> {
    if (!auth.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await fetch(getUrl('restart'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao reiniciar instância:", error);
      return { status: "error", mensagem: "Erro ao reiniciar instância" };
    }
  },
  
  async disconnectAccount(payload: InstancePayload): Promise<ApiResponse> {
    if (!auth.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await fetch(getUrl('disconnect'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao desconectar conta:", error);
      return { status: "error", mensagem: "Erro ao desconectar conta" };
    }
  },
  
  async checkStatus(payload: InstancePayload): Promise<ApiResponse> {
    if (!auth.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await fetch(getUrl('status'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      return { status: "error", mensagem: "Erro ao verificar status" };
    }
  },

  async postInstanceWebhook(data: { username: string; password: string; instancia: string }) {
    try {
      const secureData = {
        ...data,
        password: encryptSensitiveData(data.password)
      };
      
      const response = await fetch(`${API_URL}/instancia`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify(secureData)
      });

      return await response.json();
    } catch (error) {
      console.error('Erro no webhook:', error);
      throw error;
    }
  },

  // Método para buscar instâncias disponíveis
  async getAvailableInstances(credentials: AuthPayload): Promise<Array<{
    instancia: string;
    nome?: string;
    telefone?: string;
    status?: string;
    mensagem?: string;
    foto?: string;
  }>> {
    try {
      const secureCredentials = {
        ...credentials,
        password: encryptSensitiveData(credentials.password)
      };

      const response = await fetch(`${endpoints.base}${endpoints.auth}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_CONFIG.JWT_SECRET}`,
          'X-Algorithm': AUTH_CONFIG.JWT_ALGORITHM,
          'X-Key-Type': AUTH_CONFIG.KEY_TYPE
        },
        body: JSON.stringify(secureCredentials)
      });

      const data = await response.json();
      
      // Se a resposta for um array, retorna diretamente
      if (Array.isArray(data)) {
        return data;
      }
      
      // Se for uma única instância, retorna como array
      if (data.instancia) {
        return [{
          instancia: data.instancia,
          nome: data.nome,
          telefone: data.telefone,
          status: data.status,
          mensagem: data.mensagem,
          foto: data.foto
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      throw error;
    }
  },

  // Utilidade para recarregar os endpoints
  reloadEndpoints: async () => {
    Object.assign(endpoints, await loadEndpoints());
  }
};
