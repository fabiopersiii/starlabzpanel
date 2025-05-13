import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { AlertCircle, User, Lock, ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { apiService } from "@/services/apiService";
import { InstanceSelectionDialog } from "@/components/InstanceSelectionDialog";

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

interface LoginScreenProps {
  onLogin: (username: string, phone: string, instanceData: Instance) => void;
}

// Função para sanitizar dados sensíveis para logs
const sanitizeDataForLogs = (data: any) => {
  if (!data) return data;
  const sanitized = { ...data };
  if (sanitized.password) {
    sanitized.password = '********';
  }
  return sanitized;
};

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [showInstanceDialog, setShowInstanceDialog] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos");
      return;
    }
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await apiService.login({ username, password });
      
      // Log seguro
      console.debug('Login response:', sanitizeDataForLogs(response));
      
      // Se a resposta for um array, significa que há múltiplas instâncias
      if (Array.isArray(response)) {
        const instancesWithCredentials = response.map(instance => ({
          ...instance,
          username,
          password,
          instancia: instance.instancia || instance.id || "default_instance"
        }));
        setInstances(instancesWithCredentials);
        setShowInstanceDialog(true);
        return;
      }
      
      if (response.mensagem === "Login efetuado com sucesso!") {
        // Garantir que todos os dados necessários estejam presentes
        const instanceData: Instance = {
          ...response,
          username,
          password,
          instancia: response.instancia || "default_instance",
          nome: response.nome || username,
          telefone: response.telefone || "",
          status: response.status || "disconnected"
        };

        onLogin(
          instanceData.nome,
          instanceData.telefone,
          instanceData
        );
      } else {
        setError(response.mensagem || "Erro no login. Verifique suas credenciais.");
      }
    } catch (error) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      <div className="w-full max-w-md transform scale-95">
        <div className="logo-container mx-auto -mb-16 relative z-10 w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-blue-500 shadow-xl">
          <img 
            src="https://i.postimg.cc/k41KxS8H/Star-labz.png" 
            alt="Star Labz Logo" 
            className="w-28 h-28 object-contain" 
          />
        </div>
        
        <Card className="bg-gray-800 border-gray-700 shadow-xl">
          <CardHeader className="pt-20">
            <h1 className="text-3xl font-bold text-center text-white">STARLABZ</h1>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  id="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                  disabled={isLoading}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="password"
                  id="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <div className="bg-red-900/40 border border-red-800 rounded-md p-3 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}
              
              <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 py-6 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>Entrando...</>
                ) : (
                  <>Entrar <ArrowRight className="h-5 w-5" /></>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter>
            <p className="text-sm text-gray-400 text-center w-full">
              {isLoading ? "Verificando suas credenciais..." : "Digite suas credenciais para entrar"}
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <Footer />

      <InstanceSelectionDialog
        open={showInstanceDialog}
        instances={instances}
        onSelect={async (selectedInstance) => {
          try {
            setIsLoading(true);
            
            // Chama o webhook com os dados necessários
            const webhookResponse = await apiService.postInstanceWebhook({
              username,
              password,
              instancia: selectedInstance.instancia
            });
            
            // Atualiza os dados da instância com a resposta do webhook
            const updatedInstance: Instance = {
              ...selectedInstance,
              nome: webhookResponse.nome || selectedInstance.nome || username,
              telefone: webhookResponse.telefone || selectedInstance.telefone || "",
              status: webhookResponse.status || selectedInstance.status || "disconnected",
              foto: webhookResponse.foto,
              username,
              password
            };
            
            setShowInstanceDialog(false);
            onLogin(
              updatedInstance.nome,
              updatedInstance.telefone,
              updatedInstance
            );
          } catch (error) {
            setError("Erro ao configurar a instância selecionada");
            setShowInstanceDialog(false);
          } finally {
            setIsLoading(false);
          }
        }}
      />
    </div>
  );
};
