// Created: 2026-03-18
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate } from '../utils/helpers';
import { exportToCSV } from '../utils/csv';
import { Plus, Trash2, Download, Search, CalendarDays, X } from 'lucide-react';

const ACTIVITY_TYPES = ['정기모임', '봉사활동', '특별활동', '기타'];

export default function Attendance() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ memberId: '', date: new Date().toISOString().slice(0, 10), type: '정기모임', note: '' });

  const activeMembers = state.members.filter(m => m.status !== 'withdrawn');

  function getMemberName(id) {
    return state.members.find(m => m.id === id)?.name || '(알 수 없음)';
  }

  const filtered = state.attendance
    .filter(a => {
      const name = getMemberName(a.memberId);
      const matchSearch = !search || name.includes(search);
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      const matchFrom = !dateFrom || a.date >= dateFrom;
      const matchTo = !dateTo || a.date <= dateTo;
      return matchSearch && matchType && matchFrom && matchTo;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleAdd(e) {
    e.preventDefault();
    if (!form.memberId) return;
    dispatch({ type: 'ADD_ATTENDANCE', payload: { id: generateId(), ...form } });
    setShowModal(false);
    setForm({ memberId: '', date: new Date().toISOString().slice(0, 10), type: '정기모임', note: '' });
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_ATTENDANCE', payload: id });
  }

  function handleExport() {
    exportToCSV(filtered, '출석기록.csv', [
      { label: '날짜', accessor: 'date' },
      { label: '회원명', accessor: (a) => getMemberName(a.memberId) },
      { label: '활동유형', accessor: 'type' },
      { label: '메모', accessor: 'note' },
    ]);
  }

  // Monthly summary
  const selectedMonth = dateFrom ? dateFrom.slice(0, 7) : new Date().toISOString().slice(0, 7);
  const monthRecords = state.attendance.filter(a => a.date.startsWith(selectedMonth));
  const memberCounts = {};
  monthRecords.forEach(a => {
    const name = getMemberName(a.memberId);
    memberCounts[name] = (memberCounts[name] || 0) + 1;
  });
  const sortedCounts = Object.entries(memberCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">출석 관리</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> 출석 기록 추가
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="회원명 검색..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="all">전체 유형</option>
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="시작일"
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="종료일"
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <button onClick={handleExport} className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            <Download size={18} /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">날짜</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">회원명</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">활동유형</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">메모</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">출석 기록이 없습니다.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{formatDate(a.date)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{getMemberName(a.memberId)}</td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{a.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px] truncate">{a.note || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays size={20} className="text-indigo-500" /> 월별 출석 현황
          </h3>
          <p className="text-sm text-gray-500 mb-3">{selectedMonth}</p>
          {sortedCounts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">기록 없음</p>
          ) : (
            <ul className="space-y-2">
              {sortedCounts.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min((count / 10) * 100, 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">{count}회</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">출석 기록 추가</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회원 선택 *</label>
                <select required value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">선택하세요</option>
                  {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">활동 유형</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={3} placeholder="선택 사항"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
