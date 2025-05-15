import React from "react";
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { ConnectionStatus } from "@/hooks/useInstance";

interface Instance {
  instancia: string;
  nome?: string;
  telefone?: string;
  status?: string;
  mensagem?: string;
  foto?: string;
}
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCodeSection } from "@/components/QrCodeSection";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { InstanceControls } from "@/components/InstanceControls";
import { DashboardHeader } from "@/components/DashboardHeader";
import { ConnectionInfoSection } from "@/components/ConnectionInfoSection";
import { Footer } from "@/components/Footer";
import { authMiddleware } from "@/lib/authMiddleware";

const Dashboard = () => {
  const navigate = useNavigate();
  const [instanceStatus, setInstanceStatus] = React.useState<ConnectionStatus>("disconnected");

  React.useEffect(() => {
    if (!authMiddleware.isAuthenticated()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const [selectedInstance, setSelectedInstance] = React.useState('');
  const [instances, setInstances] = React.useState<Instance[]>([]);
  const [userData] = React.useState({
    name: authMiddleware.getUserRole() || '',
    phone: '', // Will be populated when instance is selected
    username: authMiddleware.getUserRole() || '',
    password: '••••••' // Na prática, isso deveria vir de um contexto seguro
  });

  const handleLogout = () => {
    authMiddleware.clearToken();
    navigate('/login');
  };

  const handleInstanceUpdate = (instance: Instance) => {
    setSelectedInstance(instance.instancia);
    setInstances(prev => prev.map(i =>
      i.instancia === instance.instancia ? instance : i
    ));
  };

  const handleRestart = async () => {
    try {
      await apiService.restartInstance({
        instancia: selectedInstance
      });
      toast.success('Instância reiniciada com sucesso');
    } catch (error) {
      toast.error('Erro ao reiniciar instância');
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiService.disconnectAccount({
        instancia: selectedInstance
      });
      setSelectedInstance('');
      toast.success('Instância desconectada');
    } catch (error) {
      toast.error('Erro ao desconectar instância');
    }
  };

  React.useEffect(() => {
    const loadInstances = async () => {
      try {
        const data = await apiService.getAvailableInstances(userData);
        setInstances(data);
      } catch (error) {
        toast.error('Erro ao carregar instâncias');
      }
    };
    
    loadInstances();
  }, [userData]);

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader 
        userData={{ 
          name: userData.username,
          phone: selectedInstance ? 
            instances.find(i => i.instancia === selectedInstance)?.telefone || '' 
            : ''
        }}
        connectionInfo={{
          name: selectedInstance ? 
            instances.find(i => i.instancia === selectedInstance)?.nome || '' 
            : '',
          phone: selectedInstance ? 
            instances.find(i => i.instancia === selectedInstance)?.telefone || '' 
            : '',
          status: instanceStatus === 'disconnected' ? 'Desconectado' : 'Conectado',
          photoUrl: selectedInstance ? 
            instances.find(i => i.instancia === selectedInstance)?.foto 
            : undefined
        }}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        <ConnectionBanner 
          connectionStatus={instanceStatus}
          phone={selectedInstance ? 
            instances.find(i => i.instancia === selectedInstance)?.telefone || '' 
            : ''}
        />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>
                Informações sobre a conexão atual do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionInfoSection 
                connectionStatus={instanceStatus}
                connectionInfo={{
                  name: selectedInstance ? 
                    instances.find(i => i.instancia === selectedInstance)?.nome || '' 
                    : '',
                  phone: selectedInstance ? 
                    instances.find(i => i.instancia === selectedInstance)?.telefone || '' 
                    : '',
                  status: instanceStatus === 'disconnected' ? 'Desconectado' : 'Conectado',
                  photoUrl: selectedInstance ? 
                    instances.find(i => i.instancia === selectedInstance)?.foto 
                    : undefined
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>
                Escaneie o QR Code para conectar seu WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QrCodeSection 
                instanceData={selectedInstance ? 
                  instances.find(i => i.instancia === selectedInstance) || null 
                  : null}
                connectionStatus={instanceStatus}
                isLoading={false}
                qrCodeData={null}
                countdown={0}
                setCountdown={() => {}}
                onSuccessfulConnection={() => Promise.resolve()}
                onGenerateQRCode={() => Promise.resolve()}
                onResetAndGenerate={() => Promise.resolve()}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controles</CardTitle>
              <CardDescription>
                Gerencie sua instância do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstanceControls
                onStatusCheck={() => setInstanceStatus('connected')}
                instanceName={selectedInstance}
                availableInstances={instances}
                onInstanceUpdate={handleInstanceUpdate}
                onRestart={handleRestart}
                onDisconnect={handleDisconnect}
                isDisconnectDisabled={!selectedInstance}
                userData={userData}
              />
            </CardContent>
          </Card>
        </div>

        {authMiddleware.hasRole('admin') && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Acessar Painel Administrativo
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
