// Created: 2026-03-18
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function CompleteProfile() {
  const { profile, loading, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: profile?.name || '', phone: '' });
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profile?.name && profile?.phone) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (!error) navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">프로필 완성</h2>
        <p className="text-sm text-gray-500 mb-6">기본 정보를 입력해주세요</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
