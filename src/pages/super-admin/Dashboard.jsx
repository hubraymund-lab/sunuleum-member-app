// Created: 2026-03-28
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['super-admin', 'branches'],
    queryFn: async () => {
      const { data } = await supabase.from('branches').select('*').order('created_at');
      return data || [];
    },
  });

  const { data: memberCounts = {}, isLoading: loadingCounts } = useQuery({
    queryKey: ['super-admin', 'member-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('branch_members').select('branch_id');
      const counts = {};
      (data || []).forEach(m => {
        counts[m.branch_id] = (counts[m.branch_id] || 0) + 1;
      });
      return counts;
    },
  });

  if (loadingBranches) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">시스템 관리 대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(branch => (
          <div
            key={branch.id}
            onClick={() => navigate(`/branch/${branch.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Building2 className="text-indigo-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  branch.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {branch.status === 'active' ? '운영중' : '비활성'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={16} />
              <span>회원 {memberCounts[branch.id] || 0}명</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
