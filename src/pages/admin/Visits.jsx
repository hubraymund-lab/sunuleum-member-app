// Created: 2026-03-28
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { QrCode, Plus, Calendar, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function AdminVisits() {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQR, setShowQR] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualUserId, setManualUserId] = useState('');

  const checkinUrl = `${window.location.origin}/branch/${branchId}/checkin`;

  // Fetch visits for selected date
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['admin-visits', branchId, selectedDate],
    queryFn: async () => {
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;
      const { data } = await supabase
        .from('visits')
        .select('*, profile:profiles(name, email, phone)')
        .eq('branch_id', branchId)
        .gte('visited_at', startOfDay)
        .lte('visited_at', endOfDay)
        .order('visited_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch branch members for manual add
  const { data: members = [] } = useQuery({
    queryKey: ['branch-members-list', branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from('branch_members')
        .select('*, profile:profiles(id, name, email)')
        .eq('branch_id', branchId)
        .eq('status', 'active');
      return data || [];
    },
  });

  // Monthly summary
  const currentMonth = selectedDate.substring(0, 7);
  const { data: monthlySummary = [] } = useQuery({
    queryKey: ['admin-visits-monthly', branchId, currentMonth],
    queryFn: async () => {
      const startOfMonth = `${currentMonth}-01T00:00:00`;
      const endDate = new Date(parseInt(currentMonth.split('-')[0]), parseInt(currentMonth.split('-')[1]), 0);
      const endOfMonth = `${currentMonth}-${String(endDate.getDate()).padStart(2, '0')}T23:59:59`;
      const { data } = await supabase
        .from('visits')
        .select('user_id, profile:profiles(name)')
        .eq('branch_id', branchId)
        .gte('visited_at', startOfMonth)
        .lte('visited_at', endOfMonth);
      return data || [];
    },
  });

  // Count visits per member this month
  const memberVisitCounts = monthlySummary.reduce((acc, v) => {
    const name = v.profile?.name || '알 수 없음';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  async function handleManualAdd() {
    if (!manualUserId) return;
    const { error } = await supabase.from('visits').insert({
      branch_id: branchId,
      user_id: manualUserId,
      method: 'manual',
      visited_at: `${selectedDate}T${new Date().toTimeString().slice(0, 8)}`,
    });
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin-visits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-visits-monthly'] });
      setShowManualAdd(false);
      setManualUserId('');
    } else if (error.code === '23505') {
      alert('해당 회원은 이미 이 날짜에 체크인되어 있습니다.');
    }
  }

  async function handleDelete(visitId) {
    if (!confirm('이 방문 기록을 삭제하시겠습니까?')) return;
    await supabase.from('visits').delete().eq('id', visitId);
    queryClient.invalidateQueries({ queryKey: ['admin-visits'] });
    queryClient.invalidateQueries({ queryKey: ['admin-visits-monthly'] });
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">방문 관리</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <QrCode size={16} /> QR 코드
          </button>
          <button
            onClick={() => setShowManualAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Plus size={16} /> 수동 등록
          </button>
        </div>
      </div>

      {/* Date selector and stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="text-sm text-gray-500 block mb-2">날짜 선택</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar size={16} /> 오늘 방문
          </div>
          <p className="text-2xl font-bold text-gray-900">{visits.length}명</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Users size={16} /> 이번 달 총 방문
          </div>
          <p className="text-2xl font-bold text-gray-900">{monthlySummary.length}회</p>
        </div>
      </div>

      {/* Visit list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} 방문자
          </h2>
        </div>
        {visits.length === 0 ? (
          <div className="p-8 text-center text-gray-400">방문 기록이 없습니다.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">이름</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">연락처</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">시간</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">방법</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visits.map(visit => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{visit.profile?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{visit.profile?.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(visit.visited_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      visit.method === 'qr' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {visit.method === 'qr' ? 'QR' : '수동'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(visit.id)} className="text-xs text-red-500 hover:text-red-700">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Monthly member visit count */}
      {Object.keys(memberVisitCounts).length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">이번 달 회원별 방문 횟수</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(memberVisitCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => (
                <div key={name} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-900">{name}</span>
                  <span className="text-sm font-medium text-indigo-600">{count}회</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <Modal onClose={() => setShowQR(false)} title="방문 체크인 QR 코드">
          <div className="text-center">
            <div className="bg-white p-6 inline-block rounded-xl border border-gray-200">
              <QRCodeSVG value={checkinUrl} size={240} level="H" />
            </div>
            <p className="text-sm text-gray-500 mt-4">이 QR 코드를 스캔하면 방문 체크인이 됩니다.</p>
            <p className="text-xs text-gray-400 mt-1 break-all">{checkinUrl}</p>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              닫기
            </button>
          </div>
        </Modal>
      )}

      {/* Manual Add Modal */}
      {showManualAdd && (
        <Modal onClose={() => setShowManualAdd(false)} title="수동 방문 등록">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회원 선택</label>
              <select
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">회원을 선택하세요</option>
                {members.map(m => (
                  <option key={m.profile?.id} value={m.profile?.id}>
                    {m.profile?.name} ({m.profile?.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowManualAdd(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleManualAdd}
                disabled={!manualUserId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                등록
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
