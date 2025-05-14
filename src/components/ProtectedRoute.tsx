import { Navigate, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
=======
import { useEffect } from 'react';
import { authMiddleware } from '@/lib/authMiddleware';
>>>>>>> 614aa140824928cf9384ac7a47c208d33a17f6ce
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const navigate = useNavigate();
<<<<<<< HEAD
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

=======

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
>>>>>>> 614aa140824928cf9384ac7a47c208d33a17f6ce
  return <>{children}</>;
};
