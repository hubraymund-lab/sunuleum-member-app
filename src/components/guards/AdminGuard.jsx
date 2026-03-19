// Created: 2026-03-18
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import LoadingSpinner from '../common/LoadingSpinner';

export default function AdminGuard() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
