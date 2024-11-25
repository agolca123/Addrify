import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRole?: 'admin' | 'user';
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRole }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/client'} />;
  }

  return <>{children}</>;
};