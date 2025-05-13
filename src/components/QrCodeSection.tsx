
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { QrCode, Loader, RefreshCw } from "lucide-react";
import { ConnectionStatus } from "@/hooks/useInstance";

interface QrCodeSectionProps {
  instanceData: any | null;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  qrCodeData: string | null;
  countdown: number;
  setCountdown: (value: number) => void;
  onSuccessfulConnection: (data: any) => void;
  onGenerateQRCode: () => Promise<void>;
  onResetAndGenerate: () => Promise<void>;
}

export const QrCodeSection = ({
  instanceData,
  connectionStatus,
  isLoading,
  qrCodeData,
  countdown,
  setCountdown,
  onSuccessfulConnection,
  onGenerateQRCode,
  onResetAndGenerate
}: QrCodeSectionProps) => {
  // Estado local para indicar se a autogeração está pausada
  const [isAutoGenerationPaused, setIsAutoGenerationPaused] = useState(false);
  
  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && qrCodeData && !isAutoGenerationPaused) {
      // Este efeito não vai gerar automaticamente - isso é gerenciado pelo hook useInstance
    }
  }, [countdown, qrCodeData, onGenerateQRCode, setCountdown, isAutoGenerationPaused]);
  
  // Atualizar o estado isAutoGenerationPaused quando o contador chegar a 0 após 2 minutos
  useEffect(() => {
    if (countdown === 0 && qrCodeData && !isLoading) {
      // Assumir que a geração foi pausada se não houver um novo carregamento automático
      setTimeout(() => {
        if (countdown === 0 && !isLoading) {
          setIsAutoGenerationPaused(true);
        }
      }, 1000);
    }
  }, [countdown, qrCodeData, isLoading]);
  
  // Resetar o estado quando um novo QR code é gerado
  useEffect(() => {
    if (isLoading) {
      setIsAutoGenerationPaused(false);
    }
  }, [isLoading]);
  
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center">
      <div className="w-full md:w-1/2 flex flex-col items-center">
        <div className="qr-container bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 w-64 h-64 flex items-center justify-center mb-4">
          {qrCodeData ? (
            <img 
              src={`data:image/png;base64,${qrCodeData}`} 
              alt="QR Code" 
              className="max-w-full max-h-full" 
            />
          ) : (
            <div className="text-center text-gray-500">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Loader className="h-12 w-12 text-blue-600 animate-spin mb-2" />
                  <p>Gerando QR Code...</p>
                </div>
              ) : (
                <p>Clique em "Gerar QR Code" para começar</p>
              )}
            </div>
          )}
        </div>
        
        {countdown > 0 && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-1">QR Code expira em:</p>
            <span className="text-xl font-bold text-blue-600">{countdown}s</span>
          </div>
        )}
        
        {isAutoGenerationPaused && qrCodeData && (
          <div className="text-center mb-4">
            <p className="text-sm text-orange-600 mb-1">
              Geração automática pausada após 2 minutos
            </p>
          </div>
        )}
        
        <div className="flex gap-2 w-full">
          <Button 
            onClick={onGenerateQRCode}
            disabled={isLoading || countdown > 0 || connectionStatus === "connected"}
            className="flex-1 items-center justify-center gap-2"
          >
            <QrCode className="h-5 w-5" /> 
            {isLoading ? "Gerando..." : "Gerar QR Code"}
          </Button>
          
          {isAutoGenerationPaused && (
            <Button 
              onClick={onResetAndGenerate}
              disabled={isLoading || connectionStatus === "connected"}
              variant="outline"
              className="items-center justify-center"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="w-full md:w-1/2">
        <Card className="bg-blue-50 border-blue-200 p-4">
          <h3 className="font-bold text-lg mb-3 text-blue-800">Como conectar sua conta:</h3>
          <ol className="list-decimal pl-5 space-y-3">
            <li className="text-gray-700">Abra o WhatsApp no seu celular</li>
            <li className="text-gray-700">Toque em Menu (três pontos) ou Configurações</li>
            <li className="text-gray-700">Selecione WhatsApp Web/Desktop</li>
            <li className="text-gray-700">Aponte a câmera do seu celular para o QR Code</li>
            <li className="text-gray-700">Aguarde a leitura ser concluída</li>
          </ol>
          <div className="mt-4 bg-blue-100 p-3 rounded-md border border-blue-200 flex items-start">
            <div className="text-blue-600 mr-2 mt-1">ℹ️</div>
            <p className="text-sm text-blue-700">
              O QR Code expira em 30 segundos. A geração automática será interrompida após 2 minutos sem conexão.
              Sua privacidade é nossa prioridade, a conexão é segura.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
