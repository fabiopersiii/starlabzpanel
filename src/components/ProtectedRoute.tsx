import { FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  requiredRole?: string;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const isAuthenticated = auth.isAuthenticated();

  if (!isAuthenticated) {
    toast.error('Você precisa estar autenticado para acessar esta página');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !auth.hasRole(requiredRole)) {
    toast.error('Você não tem permissão para acessar esta página');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
