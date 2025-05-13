import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEndpoints } from "@/hooks/useEndpoints";
import { AlertCircle, Save, RotateCcw, Lock, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiService } from "@/services/apiService";
import { Link, useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { authMiddleware } from "@/lib/authMiddleware";

const ADMIN_PASSWORD = "starlabzadmin"; // Esta senha deve ser armazenada com mais segurança em produção

const Admin = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { endpoints, updateEndpoints, resetToDefaults } = useEndpoints();
  
  // Estado para armazenar os valores editados
  const [editEndpoints, setEditEndpoints] = useState({
    base: endpoints.base,
    auth: endpoints.auth,
    qrcode: endpoints.qrcode,
    restart: endpoints.restart,
    disconnect: endpoints.disconnect,
    status: endpoints.status,
    instancia: endpoints.instancia
  });

  useEffect(() => {
    // Verifica se o usuário está autenticado e tem permissão de admin
    if (!authMiddleware.isAuthenticated() || !authMiddleware.hasRole('admin')) {
      navigate('/');
      toast.error("Acesso não autorizado");
      return;
    }
  }, [navigate]);
  
  // Tenta fazer login
  const handleLogin = () => {
    setIsLoading(true);
    
    // Simula um tempo de carregamento
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setAuthenticated(true);
        toast.success("Login efetuado com sucesso!");
      } else {
        toast.error("Senha incorreta");
      }
      setIsLoading(false);
    }, 1000);
  };
  
  // Atualiza os endpoints
  const handleSave = () => {
    updateEndpoints(editEndpoints);
    // Recarregar os endpoints no serviço de API
    apiService.reloadEndpoints();
    toast.success("Configurações salvas com sucesso!");
  };
  
  // Reseta para valores padrão
  const handleReset = () => {
    const defaults = resetToDefaults();      setEditEndpoints({
        base: defaults.base,
        auth: defaults.auth,
        qrcode: defaults.qrcode,
        restart: defaults.restart,
        disconnect: defaults.disconnect,
        status: defaults.status,
        instancia: defaults.instancia
      });
    // Recarregar os endpoints no serviço de API
    apiService.reloadEndpoints();
  };
  
  // Formulário de login
  const renderLoginForm = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Área Administrativa</CardTitle>
          <CardDescription className="text-center">
            Entre com sua senha para acessar as configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha admin"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Autenticando..." : "Entrar"}
            {!isLoading && <Lock className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-4">
        <Link to="/">
          <Button variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para página inicial
          </Button>
        </Link>
      </div>
    </div>
  );
  
  // Painel de configuração
  const renderConfigPanel = () => (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <div className="max-w-5xl mx-auto w-full flex-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <Link to="/">
            <Button variant="outline" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para página inicial
            </Button>
          </Link>
        </div>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Alterar os endpoints pode causar mau funcionamento do sistema. 
            Certifique-se de saber o que está fazendo.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Configuração de APIs</CardTitle>
            <CardDescription>
              Configure os endpoints da API utilizada pelo sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">URL Base</Label>
              <Input 
                id="baseUrl"
                value={editEndpoints.base}
                onChange={(e) => setEditEndpoints({...editEndpoints, base: e.target.value})}
                placeholder="https://api.exemplo.com"
              />
              <p className="text-sm text-gray-500">
                URL base para todos os endpoints da API
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authUrl">Endpoint de Autenticação</Label>
                <Input 
                  id="authUrl"
                  value={editEndpoints.auth}
                  onChange={(e) => setEditEndpoints({...editEndpoints, auth: e.target.value})}
                  placeholder="/auth"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="qrcodeUrl">Endpoint de QR Code</Label>
                <Input 
                  id="qrcodeUrl"
                  value={editEndpoints.qrcode}
                  onChange={(e) => setEditEndpoints({...editEndpoints, qrcode: e.target.value})}
                  placeholder="/qrcode"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="restartUrl">Endpoint de Reinicialização</Label>
                <Input 
                  id="restartUrl"
                  value={editEndpoints.restart}
                  onChange={(e) => setEditEndpoints({...editEndpoints, restart: e.target.value})}
                  placeholder="/restart"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="disconnectUrl">Endpoint de Desconexão</Label>
                <Input 
                  id="disconnectUrl"
                  value={editEndpoints.disconnect}
                  onChange={(e) => setEditEndpoints({...editEndpoints, disconnect: e.target.value})}
                  placeholder="/disconnect"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instanceUrl">Endpoint de Instância</Label>
                <Input 
                  id="instanceUrl"
                  value={editEndpoints.instancia}
                  onChange={(e) => setEditEndpoints({...editEndpoints, instancia: e.target.value})}
                  placeholder="/instancia"
                />
                <p className="text-sm text-gray-500">
                  Endpoint para gerenciamento de instâncias do WhatsApp
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statusUrl">Endpoint de Status</Label>
                <Input 
                  id="statusUrl"
                  value={editEndpoints.status}
                  onChange={(e) => setEditEndpoints({...editEndpoints, status: e.target.value})}
                  placeholder="/status"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Mudanças só terão efeito após a confirmação</AlertTitle>
                <AlertDescription>
                  Clique em "Salvar Configurações" para aplicar as alterações.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restaurar Padrões
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
  
  return authenticated ? renderConfigPanel() : renderLoginForm();
};

export default Admin;
