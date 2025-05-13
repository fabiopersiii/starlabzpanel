import { EndpointUrls } from "@/hooks/useEndpoints";

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

// Verifica se há conexão com a internet
const checkOnline = async (): Promise<boolean> => {
  try {
    await fetch('https://webhook.dpscloud.online/webhook/saas', { method: 'HEAD' });
    return true;
  } catch {
    return false;
  }
};

// Carrega os endpoints da API ou usa o cache do localStorage
const loadEndpoints = async (): Promise<EndpointUrls> => {
  try {
    // Primeiro verifica se está online
    const isOnline = await checkOnline();
    
    if (isOnline) {
      // Se estiver online, sempre tenta carregar da API primeiro
      const response = await fetch('https://webhook.dpscloud.online/webhook/saas');
      if (!response.ok) throw new Error('Falha ao carregar configurações');
    
      const data = await response.json();
      const config = convertConfigResponse(data[0]); // API retorna um array
    
      // Salva no localStorage para uso offline
      localStorage.setItem("starlabz_endpoints", JSON.stringify(config));
      return config;
    }

    // Se estiver offline, tenta usar o cache do localStorage
    const saved = localStorage.getItem("starlabz_endpoints");
    if (saved) {
      return JSON.parse(saved);
    }
    
    throw new Error('Sem conexão e sem cache local');
  } catch (e) {
    console.error("Erro ao carregar endpoints:", e);
    // Retorna valores padrão em caso de erro
    return {
      base: "https://webhook.dpscloud.online/webhook",
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
  base: "https://webhook.dpscloud.online/webhook",
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
      const response = await fetch(getUrl('auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro no login:", error);
      return { status: "error", mensagem: "Erro ao conectar com o servidor" };
    }
  },
  
  async generateQRCode(payload: InstancePayload): Promise<ApiResponse> {
    try {
      const response = await fetch(getUrl('qrcode'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao gerar QR code:", error);
      return { status: "error", mensagem: "Erro ao gerar QR code" };
    }
  },
  
  async restartInstance(payload: InstancePayload): Promise<ApiResponse> {
    try {
      const response = await fetch(getUrl('restart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao reiniciar instância:", error);
      return { status: "error", mensagem: "Erro ao reiniciar instância" };
    }
  },
  
  async disconnectAccount(payload: InstancePayload): Promise<ApiResponse> {
    try {
      const response = await fetch(getUrl('disconnect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error("Erro ao desconectar conta:", error);
      return { status: "error", mensagem: "Erro ao desconectar conta" };
    }
  },
  
  async checkStatus(payload: InstancePayload): Promise<ApiResponse> {
    try {
      const response = await fetch(getUrl('status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch('https://webhook.dpscloud.online/webhook/instancia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch(`${endpoints.base}${endpoints.auth}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

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
