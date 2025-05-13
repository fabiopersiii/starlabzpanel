import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useInstance } from "@/hooks/useInstance";
import { QrCode, Info } from "lucide-react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { InstanceControls } from "@/components/InstanceControls";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { QrCodeSection } from "@/components/QrCodeSection";
import { ConnectionInfoSection } from "@/components/ConnectionInfoSection";

interface Instance {
  instancia: string;
  nome?: string;
  telefone?: string;
  status?: string;
  mensagem?: string;
  foto?: string;
  username?: string;
  password?: string;
}

interface DashboardProps {
  userData: {
    name: string;
    phone: string;
    username: string;
    password: string;
  };
  initialInstanceData?: Instance;
  onLogout: () => void;
}

export const Dashboard = ({ userData, initialInstanceData, onLogout }: DashboardProps) => {
  const {
    instanceData,
    connectionStatus,
    isLoading,
    qrCodeData,
    countdown,
    setCountdown,
    showStatusBanner,
    setShowStatusBanner,
    connectionInfo,
    generateQRCode,
    checkStatus,
    restartInstance,
    disconnectAccount,
    updateProfileInfo,
    initializeInstance,
    resetAndGenerateQRCode
  } = useInstance();

  const [instanceName, setInstanceName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("qr");
  const [availableInstances, setAvailableInstances] = useState<Instance[]>([]);

  // Inicializar dados da instância e verificar status após login
  useEffect(() => {
    if (initialInstanceData && !instanceData) {
      setInstanceName(initialInstanceData.instancia || "default_instance");
      initializeInstance(initialInstanceData);
    }
  }, [initialInstanceData, instanceData, initializeInstance]);

  // Efeito para carregar a lista de instâncias disponíveis
  useEffect(() => {
    if (initialInstanceData) {
      setAvailableInstances(prevInstances => {
        const currentInstance = {
          instancia: initialInstanceData.instancia || "default_instance",
          nome: initialInstanceData.nome || userData.name,
          username: userData.username,
          password: userData.password,
          status: initialInstanceData.status
        };

        // Verifica se a instância já existe na lista
        if (!prevInstances.some(i => i.instancia === currentInstance.instancia)) {
          return [...prevInstances, currentInstance];
        }

        return prevInstances;
      });
    }
  }, [initialInstanceData, userData]);

  // Alternar automaticamente entre abas com base no status
  useEffect(() => {
    if (connectionStatus === "connected") {
      setActiveTab("info");
    } else if (connectionStatus === "connecting" || 
              (instanceData?.status === "connecting" && activeTab !== "qr")) {
      setActiveTab("qr");
    }
  }, [connectionStatus, instanceData?.status]);

  const handleCopyInstance = () => {
    navigator.clipboard.writeText(instanceName);
    toast.success("ID da instância copiado para a área de transferência");
  };

  const handleStatusCheck = () => {
    setShowStatusBanner(true);
    checkStatus();
  };

  const handleRestart = () => {
    restartInstance();
  };

  const handleDisconnect = () => {
    if (connectionStatus === "connected") {
      disconnectAccount();
    } else {
      toast.info("A instância já está desconectada");
    }
  };

  const handleSuccessfulConnection = (data: any) => {
    updateProfileInfo(data);
  };

  const handleInstanceUpdate = (instance: Instance) => {
    if (instance.status === "connecting") {
      setActiveTab("qr");
    }
    
    const instanceData = {
      ...instance,
      username: userData.username,
      password: userData.password
    };
    setInstanceName(instanceData.instancia);
    initializeInstance(instanceData);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
        <Card className="bg-white shadow-md mb-auto">
          <CardContent className="p-0">
            {/* Header com perfil e logout */}
            <DashboardHeader 
              userData={userData} 
              connectionInfo={connectionInfo}
              onLogout={onLogout} 
            />
            
            {/* Informações e controles da instância */}
            <InstanceControls
              instanceName={instanceName}
              availableInstances={availableInstances}
              onInstanceUpdate={handleInstanceUpdate}
              onStatusCheck={handleStatusCheck}
              onRestart={handleRestart}
              onDisconnect={handleDisconnect}
              isDisconnectDisabled={connectionStatus !== "connected"}
              userData={{
                username: userData.username,
                password: userData.password
              }}
            />
            
            {/* Banner de status de conexão */}
            {showStatusBanner && (
              <ConnectionBanner connectionStatus={connectionStatus} phone={connectionInfo.phone} />
            )}
            
            {/* Tabs */}
            <div className="px-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                  <TabsTrigger value="qr" className="flex gap-2 items-center">
                    <QrCode className="h-4 w-4" /> QR Code
                  </TabsTrigger>
                  <TabsTrigger value="info" className="flex gap-2 items-center">
                    <Info className="h-4 w-4" /> Informações
                  </TabsTrigger>
                </TabsList>
                <Separator className="my-4" />
                <TabsContent value="qr" className="pt-2 pb-4">
                  <QrCodeSection 
                    instanceData={instanceData}
                    connectionStatus={connectionStatus}
                    isLoading={isLoading}
                    qrCodeData={qrCodeData}
                    countdown={countdown}
                    setCountdown={setCountdown}
                    onSuccessfulConnection={handleSuccessfulConnection}
                    onGenerateQRCode={generateQRCode}
                    onResetAndGenerate={resetAndGenerateQRCode}
                  />
                </TabsContent>
                <TabsContent value="info" className="pt-2 pb-4">
                  <ConnectionInfoSection 
                    connectionStatus={connectionStatus}
                    connectionInfo={connectionInfo}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};
