// Created: 2026-03-28
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import LoadingSpinner from '../common/LoadingSpinner';

export default function SuperAdminGuard() {
  const { isSuperAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
