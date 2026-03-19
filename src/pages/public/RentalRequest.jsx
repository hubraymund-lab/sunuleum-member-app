// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, CheckCircle } from 'lucide-react';

export default function RentalRequest() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    facility_id: '', requester_name: '', requester_phone: '', requester_email: '',
    date: '', start_time: '', end_time: '', purpose: '',
  });

  useEffect(() => {
    supabase.from('facilities').select('*').order('name').then(({ data }) => {
      setFacilities(data || []);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const { error } = await supabase.from('rentals').insert(form);
    if (!error) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">신청 완료</h2>
          <p className="text-gray-500">대관 신청이 접수되었습니다. 승인 후 연락드리겠습니다.</p>
          <button onClick={() => { setSubmitted(false); setForm({ facility_id: '', requester_name: '', requester_phone: '', requester_email: '', date: '', start_time: '', end_time: '', purpose: '' }); }}
            className="mt-6 text-indigo-600 font-medium hover:underline">추가 신청하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <Building2 size={40} className="mx-auto text-indigo-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">수눌음 시설 대관 신청</h1>
          <p className="text-sm text-gray-500 mt-1">외부 기관 대관 신청서</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시설 선택 *</label>
            <select required value={form.facility_id} onChange={e => setForm({ ...form, facility_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">선택하세요</option>
              {facilities.map(f => <option key={f.id} value={f.id}>{f.name} {f.capacity > 0 ? `(${f.capacity}명)` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">신청자명 *</label>
              <input type="text" required value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
              <input type="tel" required value={form.requester_phone} onChange={e => setForm({ ...form, requester_phone: e.target.value })} placeholder="010-0000-0000"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input type="email" value={form.requester_email} onChange={e => setForm({ ...form, requester_email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간 *</label>
              <input type="time" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간 *</label>
              <input type="time" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적</label>
            <textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} rows={3} placeholder="사용 목적을 입력해주세요"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            대관 신청
          </button>
        </form>
      </div>
    </div>
  );
}
