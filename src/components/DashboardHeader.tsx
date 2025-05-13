
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ConnectionInfo } from "@/hooks/useInstance";

interface DashboardHeaderProps {
  userData: {
    name: string;
    phone: string;
  };
  connectionInfo: ConnectionInfo;
  onLogout: () => void;
}

export const DashboardHeader = ({ userData, connectionInfo, onLogout }: DashboardHeaderProps) => {
  return (
    <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center">
        <Avatar className="h-12 w-12 mr-3">
          {connectionInfo.photoUrl ? (
            <AvatarImage src={connectionInfo.photoUrl} alt={connectionInfo.name} />
          ) : (
            <AvatarFallback className="bg-blue-100">
              <i className="fas fa-user text-blue-500"></i>
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium">Olá, {userData.name}</p>
          <p className="text-sm text-gray-500">{userData.phone}</p>
        </div>
      </div>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex items-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i> Sair
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado da sua conta STARLABZ. Será necessário fazer login novamente para acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onLogout}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
