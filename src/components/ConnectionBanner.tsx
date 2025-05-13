
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ConnectionStatus } from "@/hooks/useInstance";

interface ConnectionBannerProps {
  connectionStatus: ConnectionStatus;
  phone: string;
}

export const ConnectionBanner = ({ connectionStatus, phone }: ConnectionBannerProps) => {
  const getStatusColorClass = () => {
    switch (connectionStatus) {
      case "connected": return "bg-green-50 border-green-200";
      case "connecting": return "bg-amber-50 border-amber-200";
      default: return "bg-red-50 border-red-200";
    }
  };
  
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected": return "bg-green-500";
      case "connecting": return "bg-amber-500";
      default: return "bg-red-500";
    }
  };
  
  const getStatusTitle = () => {
    switch (connectionStatus) {
      case "connected": return "Instância conectada";
      case "connecting": return "Conectando";
      default: return "Instância desconectada";
    }
  };
  
  const getStatusMessage = () => {
    switch (connectionStatus) {
      case "connected": return "Instância conectada e funcionando normalmente";
      case "connecting": return "Aguardando leitura do QR code";
      default: return "Instância não está conectada ao WhatsApp";
    }
  };

  return (
  <div className="px-4 pt-4">
    <Alert className={`w-full max-w-full px-4 py-2 ${getStatusColorClass()}`}>
      <div className="flex flex-wrap items-center">
        <div className={`rounded-full w-8 h-8 mr-3 ${getStatusIcon()} flex items-center justify-center`}>
          <i className="fas fa-circle text-white"></i>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-lg font-bold break-words">Status da Conexão</AlertTitle>
          <AlertDescription className={
            connectionStatus === "connected"
              ? 'text-green-700'
              : connectionStatus === "connecting"
              ? 'text-amber-700'
              : 'text-red-700'
          }>
            {getStatusMessage()}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  </div>
);

};
