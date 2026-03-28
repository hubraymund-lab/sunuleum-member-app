// Created: 2026-03-28
import { Navigate } from 'react-router-dom';
import { useBranch } from '../lib/branch';
import LoadingSpinner from './common/LoadingSpinner';

export default function RootRedirect() {
  const { currentBranch, branches, loading } = useBranch();

  if (loading) return <LoadingSpinner />;

  if (currentBranch) {
    return <Navigate to={`/branch/${currentBranch.id}`} replace />;
  }

  if (branches.length === 1) {
    return <Navigate to={`/branch/${branches[0].id}`} replace />;
  }

  return <Navigate to="/select-branch" replace />;
}
