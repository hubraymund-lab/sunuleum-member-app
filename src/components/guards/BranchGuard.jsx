// Created: 2026-03-28
import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useBranch } from '../../lib/branch';
import LoadingSpinner from '../common/LoadingSpinner';

export default function BranchGuard() {
  const { branchId } = useParams();
  const { isSuperAdmin } = useAuth();
  const { branches, switchBranch, loading, currentBranch } = useBranch();

  useEffect(() => {
    if (branchId && branchId !== currentBranch?.id) {
      switchBranch(branchId);
    }
  }, [branchId]);

  if (loading) return <LoadingSpinner />;

  const hasAccess = isSuperAdmin || branches.some(b => b.id === branchId);
  if (!hasAccess) return <Navigate to="/select-branch" replace />;

  return <Outlet />;
}
