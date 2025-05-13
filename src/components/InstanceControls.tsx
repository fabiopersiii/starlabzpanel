import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff, Info, Check } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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

interface InstanceControlsProps {
  instanceName: string;
  availableInstances: Instance[];
  onInstanceUpdate: (instance: Instance) => void;
  onStatusCheck: () => void;
  onRestart: () => void;
  onDisconnect: () => void;
  isDisconnectDisabled: boolean;
  userData: {
    username: string;
    password: string;
  };
}

export const InstanceControls = ({ 
  instanceName, 
  availableInstances: initialInstances,
  onInstanceUpdate,
  onStatusCheck, 
  onRestart, 
  onDisconnect,
  isDisconnectDisabled,
  userData
}: InstanceControlsProps) => {
  const [availableInstances, setAvailableInstances] = useState(initialInstances);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadInstances = async () => {
      try {
        setIsLoading(true);
        const instances = await apiService.getAvailableInstances({
          username: userData.username,
          password: userData.password
        });

        // Atualiza a lista de instâncias com as credenciais
        const instancesWithCredentials = instances.map(instance => ({
          ...instance,
          username: userData.username,
          password: userData.password
        }));

        setAvailableInstances(instancesWithCredentials);
      } catch (error) {
        console.error("Erro ao carregar instâncias:", error);
        toast.error("Erro ao carregar lista de instâncias");
      } finally {
        setIsLoading(false);
      }
    };

    loadInstances();
  }, [userData.username, userData.password]);

  const handleInstanceUpdate = async (selectedInstance: string) => {
    try {
      const instance = availableInstances.find(i => i.instancia === selectedInstance);
      if (!instance) return;

      const response = await apiService.postInstanceWebhook({
        username: userData.username,
        password: userData.password,
        instancia: selectedInstance
      });

      // Atualiza os dados da instância com a resposta do webhook
      const updatedInstance: Instance = {
        ...instance,
        username: userData.username,
        password: userData.password,
        nome: response.nome || instance.nome,
        telefone: response.telefone || instance.telefone,
        status: response.status || instance.status,
        foto: response.foto
      };

      onInstanceUpdate(updatedInstance);
      toast.success("Instância atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar instância");
    }
  };

  return (
    <div className="border-b">
      <div className="p-4 flex flex-wrap gap-4 items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <Select
              value={instanceName}
              onValueChange={handleInstanceUpdate}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue placeholder={isLoading ? "Carregando instâncias..." : "Selecione uma instância"} />
              </SelectTrigger>
              <SelectContent>
                {availableInstances.map((instance) => (
                  <SelectItem 
                    key={instance.instancia} 
                    value={instance.instancia}
                  >
                    {instance.nome || instance.instancia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleInstanceUpdate(instanceName)}
              className="ml-2"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-end w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="default" 
              size="sm"
              onClick={onStatusCheck}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Info className="mr-2 h-4 w-4" /> Status
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reiniciar a instância?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá desconectar qualquer conta atual. Você precisará escanear o QR Code novamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onRestart}>Reiniciar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
                disabled={isDisconnectDisabled}
              >
                <WifiOff className="mr-2 h-4 w-4" /> Desconectar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desconectar a instância?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá desconectar a conta atual do WhatsApp. Você precisará escanear o QR Code novamente para reconectar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDisconnect}>Desconectar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
