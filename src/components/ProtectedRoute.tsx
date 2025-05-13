import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { authMiddleware } from '@/lib/authMiddleware';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se o usuário está autenticado
    if (!authMiddleware.isAuthenticated()) {
      toast.error("Você precisa estar logado para acessar esta página");
      navigate('/');
      return;
    }

    // Se houver uma role requerida, verifica se o usuário tem a permissão
    if (requiredRole && !authMiddleware.hasRole(requiredRole)) {
      toast.error("Você não tem permissão para acessar esta página");
      navigate('/');
      return;
    }
  }, [navigate, requiredRole]);

  // Se não estiver autenticado, redireciona para a página inicial
  if (!authMiddleware.isAuthenticated()) {
    return <Navigate to="/" />;
  }

  // Se precisar de uma role específica e não tiver, redireciona
  if (requiredRole && !authMiddleware.hasRole(requiredRole)) {
    return <Navigate to="/" />;
  }

  // Se passou por todas as verificações, renderiza o conteúdo
  return <>{children}</>;
};
