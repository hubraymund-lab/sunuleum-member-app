// Created: 2026-03-18
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Login() {
  const { isAuthenticated, loading, signInWithGoogle, signInWithKakao } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">수눌음</h1>
          <p className="text-gray-500">회원 관리 시스템</p>
        </div>

        <div className="space-y-3">
          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 로그인
          </button>

          <button onClick={signInWithKakao}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] rounded-xl px-4 py-3 text-sm font-medium text-[#191919] hover:bg-[#FDD800] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.77 5.02 4.44 6.35-.14.52-.9 3.35-.93 3.56 0 0-.02.15.08.21.1.06.21.01.21.01.28-.04 3.24-2.12 3.75-2.48.79.12 1.61.18 2.45.18 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
            </svg>
            카카오로 로그인
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          로그인 시 수눌음 서비스 이용에 동의합니다
        </p>
      </div>
    </div>
  );
}
