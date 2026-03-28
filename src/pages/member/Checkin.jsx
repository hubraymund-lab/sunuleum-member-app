// Created: 2026-03-28
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Checkin() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { profile, isAuthenticated, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, already, error
  const [branchName, setBranchName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // Save the checkin URL and redirect to login
      sessionStorage.setItem('checkin-redirect', window.location.pathname);
      navigate('/login', { replace: true });
      return;
    }
    doCheckin();
  }, [authLoading, isAuthenticated, branchId]);

  async function doCheckin() {
    try {
      // Fetch branch info
      const { data: branch } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single();

      if (!branch) {
        setStatus('error');
        setError('존재하지 않는 호점입니다.');
        return;
      }
      setBranchName(branch.name);

      // Try to insert visit
      const { data, error: insertError } = await supabase
        .from('visits')
        .insert({
          branch_id: branchId,
          user_id: profile.id,
          method: 'qr',
        })
        .select()
        .single();

      if (insertError) {
        // Check if it's a unique constraint violation (already checked in today)
        if (insertError.code === '23505') {
          setStatus('already');
        } else {
          setStatus('error');
          setError(insertError.message);
        }
      } else {
        setStatus('success');
      }
    } catch (err) {
      setStatus('error');
      setError('체크인 중 오류가 발생했습니다.');
    }
  }

  if (authLoading || status === 'loading') return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-500" size={40} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">방문 체크인 완료!</h1>
            <p className="text-gray-500 mb-1">{branchName}</p>
            <p className="text-sm text-gray-400">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
            <p className="text-sm text-gray-500 mt-4">{profile?.name}님, 환영합니다!</p>
          </>
        )}
        {status === 'already' && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-blue-500" size={40} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">이미 체크인 되었습니다</h1>
            <p className="text-gray-500 mb-1">{branchName}</p>
            <p className="text-sm text-gray-400">오늘 이미 방문 체크인을 하셨습니다.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-500" size={40} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">체크인 실패</h1>
            <p className="text-sm text-red-500">{error}</p>
          </>
        )}
        <button
          onClick={() => navigate(`/branch/${branchId}`)}
          className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          홈으로 이동
        </button>
      </div>
    </div>
  );
}
