// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { CalendarCheck } from 'lucide-react';

const TYPE_COLORS = {
  '정기모임': 'bg-blue-100 text-blue-700',
  '봉사활동': 'bg-green-100 text-green-700',
  '특별활동': 'bg-purple-100 text-purple-700',
  '기타': 'bg-gray-100 text-gray-700',
};

export default function MyAttendance() {
  const { branchId } = useParams();
  const { profile } = useAuth();
  const [records, setRecords] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAttendance(); }, [profile, year, branchId]);

  async function fetchAttendance() {
    if (!profile) return;
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('branch_id', branchId)
      .eq('member_id', profile.id)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Monthly summary
  const monthlyCounts = {};
  records.forEach(r => {
    const month = r.date.slice(0, 7);
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">출석 내역</h2>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* Yearly summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">{year}년 월별 출석</h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const month = `${year}-${String(i + 1).padStart(2, '0')}`;
            const count = monthlyCounts[month] || 0;
            return (
              <div key={month} className="text-center">
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                  count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-300'
                }`}>
                  {count || '-'}
                </div>
                <p className="text-xs text-gray-500 mt-1">{i + 1}월</p>
              </div>
            );
          })}
        </div>
        <p className="text-right text-sm text-gray-500 mt-3">총 <strong className="text-indigo-600">{records.length}</strong>회 출석</p>
      </div>

      {/* Records list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400 text-center">로딩 중...</p>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{year}년 출석 기록이 없습니다</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">날짜</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">유형</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">메모</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 text-gray-900">{r.date}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.type] || TYPE_COLORS['기타']}`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{r.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-200">
              {records.map(r => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{r.date}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.type] || TYPE_COLORS['기타']}`}>
                      {r.type}
                    </span>
                  </div>
                  {r.note && <p className="text-sm text-gray-500">{r.note}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
