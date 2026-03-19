// Created: 2026-03-18
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
