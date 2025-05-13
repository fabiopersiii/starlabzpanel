import { EndpointUrls } from "@/hooks/useEndpoints";
import { rateLimiter } from '@/lib/rateLimiter';
import { authMiddleware } from '@/lib/authMiddleware';

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

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

const handleRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  if (!rateLimiter.canMakeRequest()) {
    const timeToReset = rateLimiter.getTimeToReset();
    throw new ApiError(`Limite de requisições excedido. Tente novamente em ${Math.ceil(timeToReset / 1000)} segundos.`);
  }

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
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Erro na requisição: ' + (error as Error).message);
  }
};

// Verifica se há conexão com a internet
const checkOnline = async (): Promise<boolean> => {
  try {
    await handleRequest(`${API_URL}/saas`, { method: 'HEAD' });
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
    
    throw new ApiError('Sem conexão e sem cache local');
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
      const response = await handleRequest(getUrl('auth'), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();

      // Se o login for bem-sucedido e houver um token
      if (data.status === "success" && data.token) {
        authMiddleware.setToken(data.token);
      }
      
      return data;
    } catch (error) {
      console.error("Erro no login:", error);
      return { status: "error", mensagem: "Erro ao conectar com o servidor" };
    }
  },

  // Verifica se o usuário está autenticado antes de fazer requisições
  async generateQRCode(payload: InstancePayload): Promise<ApiResponse> {
    if (!authMiddleware.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await handleRequest(getUrl('qrcode'), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao gerar QR code:", error);
      return { status: "error", mensagem: "Erro ao gerar QR code" };
    }
  },
  
  async restartInstance(payload: InstancePayload): Promise<ApiResponse> {
    if (!authMiddleware.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await handleRequest(getUrl('restart'), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao reiniciar instância:", error);
      return { status: "error", mensagem: "Erro ao reiniciar instância" };
    }
  },
  
  async disconnectAccount(payload: InstancePayload): Promise<ApiResponse> {
    if (!authMiddleware.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await handleRequest(getUrl('disconnect'), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao desconectar conta:", error);
      return { status: "error", mensagem: "Erro ao desconectar conta" };
    }
  },
  
  async checkStatus(payload: InstancePayload): Promise<ApiResponse> {
    if (!authMiddleware.isAuthenticated()) {
      return { status: "error", mensagem: "Usuário não autenticado" };
    }

    try {
      const response = await handleRequest(getUrl('status'), {
        method: 'POST',
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
      const response = await handleRequest(`${API_URL}/instancia`, {
        method: 'POST',
        body: JSON.stringify(data)
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
      const response = await handleRequest(`${endpoints.base}${endpoints.auth}`, {
        method: 'POST',
        body: JSON.stringify(credentials)
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
