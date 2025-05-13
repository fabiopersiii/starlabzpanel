import { useState } from "react";
import { toast } from "sonner";

// Interface para armazenar os endpoints
export interface EndpointUrls {
  base: string;
  auth: string;
  qrcode: string;
  restart: string;
  disconnect: string;
  status: string;
  instancia: string; // URL para manipulação da instância
}

// Hook personalizado para gerenciar endpoints
export function useEndpoints() {
  // Carrega configurações salvas do localStorage ou usa os valores padrão
  const getInitialEndpoints = (): EndpointUrls => {
    const saved = localStorage.getItem("starlabz_endpoints");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar endpoints:", e);
      }
    }
    
    // Valores padrão
    return {
      base: "https://webhook.dpscloud.online/webhook",
      auth: "/auth",
      qrcode: "/qrcode",
      restart: "/restart",
      disconnect: "/disconnect",
      status: "/status",
      instancia: "/instancia" // Endpoint padrão para manipulação da instância
    };
  };
  
  const [endpoints, setEndpoints] = useState<EndpointUrls>(getInitialEndpoints);
  
  // Função para atualizar os endpoints
  const updateEndpoints = (newEndpoints: Partial<EndpointUrls>) => {
    const updated = { ...endpoints, ...newEndpoints };
    setEndpoints(updated);
    
    // Salva no localStorage
    localStorage.setItem("starlabz_endpoints", JSON.stringify(updated));
    toast.success("Endpoints atualizados com sucesso!");
    
    return updated;
  };
  
  // Função para obter URL completa de um endpoint
  const getFullUrl = (endpoint: keyof Omit<EndpointUrls, "base">): string => {
    return `${endpoints.base}${endpoints[endpoint]}`;
  };
  
  // Função para resetar para os valores padrão
  const resetToDefaults = () => {
    const defaults = {
      base: "https://webhook.dpscloud.online/webhook",
      auth: "/auth",
      qrcode: "/qrcode",
      restart: "/restart",
      disconnect: "/disconnect",
      status: "/status",
      instancia: "/instancia" // Endpoint padrão para manipulação da instância
    };
    
    setEndpoints(defaults);
    localStorage.setItem("starlabz_endpoints", JSON.stringify(defaults));
    toast.info("Endpoints redefinidos para os valores padrão");
    
    return defaults;
  };
  
  return {
    endpoints,
    updateEndpoints,
    getFullUrl,
    resetToDefaults
  };
}
