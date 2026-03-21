// Created: 2026-03-18
import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { User, Save } from 'lucide-react';

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    setMessage(error ? '저장 실패' : '저장되었습니다');
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">내 프로필</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={28} className="text-indigo-600" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{profile?.name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <p className="text-xs text-gray-400 mt-1">가입일: {profile?.join_date}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input type="email" disabled value={profile?.email || ''}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-500" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
              <Save size={18} /> {saving ? '저장 중...' : '저장'}
            </button>
            {message && <span className="text-sm text-green-600">{message}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
