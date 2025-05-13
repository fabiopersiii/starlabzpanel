
import { useState, useCallback, useRef, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";

export type ConnectionStatus = "disconnected" | "connecting" | "connected";

export interface InstanceData {
  instancia: string;
  nome?: string;
  telefone?: string;
  foto?: string;
}

export interface ConnectionInfo {
  name: string;
  phone: string;
  status: string;
  photoUrl?: string;
}

// Definição de constantes
const MAX_QR_GENERATION_TIME = 2 * 60 * 1000; // 2 minutos em milissegundos
const QR_CODE_EXPIRY = 30; // 30 segundos

export function useInstance() {
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showStatusBanner, setShowStatusBanner] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    name: "-",
    phone: "-",
    status: "Desconectado"
  });

  // Referência para controlar a geração automática de QR Code
  const qrGenerationStartTimeRef = useRef<number | null>(null);
  const shouldContinueAutoGeneration = useRef<boolean>(true);

  // Verifica se atingiu o tempo máximo para geração automática
  const checkQrGenerationTimeLimit = useCallback(() => {
    if (!qrGenerationStartTimeRef.current) {
      qrGenerationStartTimeRef.current = Date.now();
      return true;
    }
    
    const elapsedTime = Date.now() - qrGenerationStartTimeRef.current;
    if (elapsedTime > MAX_QR_GENERATION_TIME) {
      // Passou do tempo limite
      if (shouldContinueAutoGeneration.current) {
        shouldContinueAutoGeneration.current = false;
        toast.warning("Tempo limite para conexão automática excedido. O QR Code não será mais renovado automaticamente.");
      }
      return false;
    }
    return true;
  }, []);

  // Função para formatar número de telefone
  const formatPhoneNumber = (phone: string) => {
    if (/^\d+$/.test(phone)) {
      if (phone.length > 10) {
        return `+${phone.substring(0, 2)} (${phone.substring(2, 4)}) ${phone.substring(4, 9)}-${phone.substring(9)}`;
      }
      return phone;
    }
    return phone;
  };

  // Função atualizada para processar informações do perfil
  const updateProfileInfo = useCallback((data: any) => {
    if (data.nome || data.telefone || data.foto) {
      setConnectionInfo(prevInfo => {
        const updatedInfo = { ...prevInfo };
        
        if (data.nome) {
          updatedInfo.name = data.nome;
        }
        
        if (data.telefone) {
          updatedInfo.phone = formatPhoneNumber(data.telefone);
        }

        if (data.foto) {
          updatedInfo.photoUrl = data.foto;
        }
        
        return updatedInfo;
      });
    }
  }, []);

  // Reiniciar o temporizador de geração de QR Code
  const resetQrGenerationTimer = () => {
    qrGenerationStartTimeRef.current = null;
    shouldContinueAutoGeneration.current = true;
  };

  // Inicializar após login
  const initializeInstance = useCallback(async (instanceData: InstanceData) => {
    setInstanceData(instanceData);
    setShowStatusBanner(true);
    
    // Reiniciar o temporizador quando inicia uma nova instância
    resetQrGenerationTimer();
    
    // Atualizar perfil com dados iniciais se disponíveis
    if (instanceData.nome || instanceData.telefone || instanceData.foto) {
      updateProfileInfo(instanceData);
    }
    
    // Verificar status atual
    if (instanceData.instancia) {
      try {
        const statusResponse = await apiService.checkStatus({ 
          instancia: instanceData.instancia 
        });
        
        if (statusResponse.status === "open") {
          setConnectionStatus("connected");
          if (statusResponse.nome || statusResponse.telefone || statusResponse.foto) {
            updateProfileInfo(statusResponse);
          }
          setConnectionInfo(prev => ({
            ...prev,
            status: "Conectado"
          }));
        } else if (statusResponse.status === "close" || statusResponse.status === "connecting") {
          // Se não estiver conectado, gerar QR Code automaticamente
          await generateQRCode(instanceData.instancia);
        }
      } catch (error) {
        console.error("Erro ao verificar status inicial:", error);
      }
    }
  }, [updateProfileInfo]);

  // Função modificada para receber instancia como parâmetro opcional
  const generateQRCode = async (instanceId?: string) => {
    const instanciaId = instanceId || (instanceData ? instanceData.instancia : null);
    if (!instanciaId) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiService.generateQRCode({ 
        instancia: instanciaId 
      });
      
      if (response.status === "open") {
        // Account is connected
        setConnectionStatus("connected");
        setQrCodeData(null);
        setCountdown(0);
        toast.success("Conta conectada com sucesso!");
        
        if (response.nome || response.telefone || response.foto) {
          updateProfileInfo(response);
        }
        
        setConnectionInfo(prev => ({
          ...prev,
          status: "Conectado"
        }));
        
        // Redefinir o temporizador de geração
        resetQrGenerationTimer();
        
      } else if (response.status === "close" || response.status === "connecting") {
        setConnectionStatus("connecting");
        if (response.mensagem) {
          setQrCodeData(response.mensagem);
          setCountdown(QR_CODE_EXPIRY);
          toast.success("QR Code gerado com sucesso!");
        }
        
        setConnectionInfo(prev => ({
          ...prev,
          status: "Conectando..."
        }));
      }
    } catch (error) {
      toast.error("Erro ao gerar QR code");
    } finally {
      setIsLoading(false);
    }
  };

  // Monitorar contagem regressiva e renovação automática do QR Code
  useEffect(() => {
    if (countdown > 0 && connectionStatus === "connecting") {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } 
    else if (countdown === 0 && connectionStatus === "connecting" && qrCodeData) {
      // Verifica se deve continuar com a geração automática
      if (checkQrGenerationTimeLimit() && shouldContinueAutoGeneration.current) {
        // QR Code expirou e ainda dentro do limite de tempo
        toast.info("QR Code expirou, gerando um novo.");
        generateQRCode();
      } else {
        // Atingiu o tempo limite, mostrar aviso e parar de gerar
        toast.warning("A geração automática de QR Code foi interrompida após 2 minutos.");
      }
    }
  }, [countdown, connectionStatus, qrCodeData, checkQrGenerationTimeLimit]);

  const checkStatus = async () => {
    if (!instanceData) return;
    
    setShowStatusBanner(true);
    
    try {
      const response = await apiService.checkStatus({
        instancia: instanceData.instancia
      });
      
      if (response.status === "open") {
        setConnectionStatus("connected");
        toast.success("Instância conectada e funcionando!");
        
        if (response.nome || response.telefone || response.foto) {
          updateProfileInfo(response);
        }
        
        setConnectionInfo(prev => ({
          ...prev,
          status: "Conectado"
        }));

        // Redefinir o temporizador de geração quando conectado
        resetQrGenerationTimer();
        
      } else if (response.status === "close") {
        setConnectionStatus("disconnected");
        toast.warning("Instância desconectada. Gere um QR Code para conectar.");
        
        setConnectionInfo(prev => ({
          ...prev,
          status: "Desconectado"
        }));
        
      } else {
        toast.info(`Status da instância: ${response.status}`);
      }
    } catch (error) {
      toast.error("Erro ao verificar status da instância");
    }
  };

  const restartInstance = async () => {
    if (!instanceData) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiService.restartInstance({
        instancia: instanceData.instancia
      });
      
      if (response.status === "connecting") {
        setConnectionStatus("disconnected");
        setQrCodeData(null);
        setCountdown(0);
        toast.success("Instância reiniciada com sucesso");
        
        setConnectionInfo({
          name: "-",
          phone: "-",
          status: "Desconectado"
        });
        
        // Reiniciar o temporizador para a nova sessão
        resetQrGenerationTimer();
        
        // Generate new QR code after a short delay
        setTimeout(() => {
          generateQRCode();
        }, 1500);
      } else {
        toast.error("Erro ao reiniciar instância. Tente novamente.");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectAccount = async () => {
    if (!instanceData) return;
    
    try {
      const response = await apiService.disconnectAccount({
        instancia: instanceData.instancia
      });
      
      if (response.status === "success") {
        setConnectionStatus("disconnected");
        setQrCodeData(null);
        setCountdown(0);
        toast.success("Conta desconectada com sucesso!");
        
        setConnectionInfo({
          name: "-",
          phone: "-",
          status: "Desconectado"
        });
        
        // Reiniciar o temporizador para permitir nova tentativa
        resetQrGenerationTimer();
      } else {
        toast.error("Erro ao desconectar conta. Tente novamente.");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    }
  };

  // Função para permitir reiniciar manualmente a geração de QR codes
  const resetAndGenerateQRCode = async () => {
    if (connectionStatus === "connected") {
      toast.info("Você já está conectado. Desconecte primeiro para gerar um novo QR Code.");
      return;
    }
    
    // Reiniciar o temporizador
    resetQrGenerationTimer();
    
    // Gerar um novo QR Code
    await generateQRCode();
  };

  return {
    instanceData,
    setInstanceData,
    connectionStatus,
    setConnectionStatus,
    isLoading,
    qrCodeData,
    countdown,
    setCountdown,
    showStatusBanner,
    setShowStatusBanner,
    connectionInfo,
    setConnectionInfo,
    generateQRCode,
    checkStatus,
    restartInstance,
    disconnectAccount,
    updateProfileInfo,
    initializeInstance,
    resetAndGenerateQRCode
  };
}
