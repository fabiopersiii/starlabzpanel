import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      // Verifica se o usuário está autenticado
      if (!auth.isAuthenticated()) {
        toast.error("Você precisa estar logado para acessar esta página");
        navigate('/');
        return;
      }

      // Se houver uma role requerida, verifica se o usuário tem a permissão
      if (requiredRole && !auth.hasRole(requiredRole)) {
        toast.error("Você não tem permissão para acessar esta página");
        navigate('/');
        return;
      }

      setIsVerifying(false);
    };

    verifyAuth();

    // Cleanup function
    return () => {
      setIsVerifying(true);
    };
  }, [navigate, requiredRole]);

  if (isVerifying) {
    return null; // ou um componente de loading
  }

  return <>{children}</>;
};
