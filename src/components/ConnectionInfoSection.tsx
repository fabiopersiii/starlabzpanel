
import { Card } from "@/components/ui/card";
import { ConnectionStatus } from "@/hooks/useInstance";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ConnectionInfoSectionProps {
  connectionStatus: ConnectionStatus;
  connectionInfo: {
    name: string;
    phone: string;
    status: string;
    photoUrl?: string;
  };
}

export const ConnectionInfoSection = ({ connectionStatus, connectionInfo }: ConnectionInfoSectionProps) => {
  const isConnected = connectionStatus === "connected";

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-5">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Informações da Conta</h2>
        
        {!isConnected ? (
          <div className="text-center py-10">
            <div className="bg-amber-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-circle text-amber-500 text-3xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Nenhuma conta conectada</h3>
            <p className="text-gray-600">
              Gere um QR Code na aba anterior para conectar uma conta do WhatsApp
            </p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/4 flex justify-center">
              <Avatar className="w-24 h-24">
                {connectionInfo.photoUrl ? (
                  <AvatarImage 
                    src={connectionInfo.photoUrl} 
                    alt={connectionInfo.name} 
                    className="object-cover" 
                  />
                ) : (
                  <AvatarFallback className="bg-blue-100 text-3xl">
                    <i className="fas fa-user text-blue-500"></i>
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm text-gray-500 mb-1">Número</h3>
                <p className="font-semibold text-gray-900">{connectionInfo.phone}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm text-gray-500 mb-1">Nome</h3>
                <p className="font-semibold text-gray-900">{connectionInfo.name}</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
                <h3 className="text-sm text-gray-500 mb-1">Status</h3>
                <p className="font-semibold text-green-600 flex items-center">
                  <i className="fas fa-circle text-green-500 mr-2 text-xs"></i> 
                  {connectionInfo.status}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:col-span-2">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-600 mr-2 mt-1"></i>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Conexão ativa</h4>
                    <p className="text-sm text-blue-700">
                      Sua instância está conectada e pronta para uso. Você pode gerenciar mensagens 
                      e automações através da API da STARLABZ.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
