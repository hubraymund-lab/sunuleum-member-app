// Created: 2026-03-28
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useBranch } from '../lib/branch';
import { Building2 } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function BranchSelect() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { branches, loading, switchBranch } = useBranch();

  if (loading) return <LoadingSpinner />;

  function handleSelect(branch) {
    switchBranch(branch.id);
    navigate(`/branch/${branch.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">수눌음</h1>
          <p className="text-gray-500 mt-2">호점을 선택하세요</p>
        </div>

        {branches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">소속된 호점이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">관리자에게 문의하세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch)}
                className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Building2 className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                    {branch.description && (
                      <p className="text-sm text-gray-500 mt-1">{branch.description}</p>
                    )}
                    {branch.memberRole && (
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        branch.memberRole === 'admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {branch.memberRole === 'admin' ? '관리자' : '회원'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isSuperAdmin && (
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/super-admin')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              시스템 관리 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
