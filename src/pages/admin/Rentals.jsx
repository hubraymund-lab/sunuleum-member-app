// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import { CalendarRange, Check, X as XIcon } from 'lucide-react';

const STATUS_LABELS = { pending: '대기', approved: '승인', rejected: '거절', cancelled: '취소' };

export default function AdminRentals() {
  const { branchId } = useParams();
  const { profile } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [facilities, setFacilities] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchData(); }, [branchId]);

  async function fetchData() {
    const [r, f] = await Promise.all([
      supabase.from('rentals').select('*').eq('branch_id', branchId).order('date', { ascending: false }),
      supabase.from('facilities').select('id, name').eq('branch_id', branchId),
    ]);
    setRentals(r.data || []);
    const map = {};
    (f.data || []).forEach(fac => { map[fac.id] = fac.name; });
    setFacilities(map);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from('rentals').update({ status, approved_by: profile.id }).eq('id', id);
    fetchData();
  }

  const filtered = rentals.filter(r => statusFilter === 'all' || r.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">대관 관리</h2>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="all">전체</option>
          <option value="pending">대기</option>
          <option value="approved">승인</option>
          <option value="rejected">거절</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-gray-400">로딩 중...</p>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarRange size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">대관 신청이 없습니다</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">시설</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">신청자</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">날짜</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">시간</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">목적</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{facilities[r.facility_id] || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{r.requester_name}</div>
                    <div className="text-sm text-gray-500">{r.requester_phone}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{r.date}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{r.start_time?.slice(0, 5)} ~ {r.end_time?.slice(0, 5)}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px] truncate">{r.purpose || '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} label={STATUS_LABELS[r.status]} /></td>
                  <td className="px-6 py-4 text-right">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(r.id, 'approved')} className="text-green-500 hover:text-green-700 mr-2" title="승인"><Check size={18} /></button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} className="text-red-500 hover:text-red-700" title="거절"><XIcon size={18} /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
