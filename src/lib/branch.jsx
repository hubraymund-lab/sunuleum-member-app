// Created: 2026-03-28
import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { profile, isAuthenticated, isSuperAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      setLoading(false);
      return;
    }
    fetchBranches();
  }, [isAuthenticated, profile]);

  async function fetchBranches() {
    setLoading(true);

    if (isSuperAdmin) {
      // Super admin sees all branches
      const { data: allBranches } = await supabase
        .from('branches')
        .select('*')
        .eq('status', 'active')
        .order('name');
      setBranches(allBranches || []);
      setMemberships([]); // super admin doesn't need memberships

      // Auto-select from localStorage or first branch
      const saved = localStorage.getItem('sunuleum-current-branch');
      const found = allBranches?.find(b => b.id === saved);
      setCurrentBranch(found || allBranches?.[0] || null);
    } else {
      // Regular user: fetch their memberships
      const { data: memberData } = await supabase
        .from('branch_members')
        .select('*, branch:branches(*)')
        .eq('user_id', profile.id)
        .eq('status', 'active');

      const userBranches = (memberData || [])
        .filter(m => m.branch?.status === 'active')
        .map(m => ({ ...m.branch, memberRole: m.role }));

      setBranches(userBranches);
      setMemberships(memberData || []);

      const saved = localStorage.getItem('sunuleum-current-branch');
      const found = userBranches.find(b => b.id === saved);
      if (found) {
        setCurrentBranch(found);
      } else if (userBranches.length === 1) {
        setCurrentBranch(userBranches[0]);
      } else {
        setCurrentBranch(null);
      }
    }
    setLoading(false);
  }

  function switchBranch(branchId) {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      localStorage.setItem('sunuleum-current-branch', branchId);
    }
  }

  function getCurrentRole() {
    if (isSuperAdmin) return 'admin';
    const membership = memberships.find(m => m.branch_id === currentBranch?.id);
    return membership?.role || null;
  }

  const currentBranchRole = getCurrentRole();

  return (
    <BranchContext.Provider value={{
      branches,
      currentBranch,
      currentBranchRole,
      isBranchAdmin: currentBranchRole === 'admin',
      switchBranch,
      loading,
      refetchBranches: fetchBranches,
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('useBranch must be used within BranchProvider');
  return context;
}
