// Created: 2026-03-28
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useBranch } from '../../lib/branch';
import LoadingSpinner from '../common/LoadingSpinner';

export default function BranchAdminGuard() {
  const { isSuperAdmin } = useAuth();
  const { isBranchAdmin, loading, currentBranch } = useBranch();

  if (loading) return <LoadingSpinner />;
  if (!isSuperAdmin && !isBranchAdmin) {
    return <Navigate to={`/branch/${currentBranch?.id}`} replace />;
  }

  return <Outlet />;
}
