// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import { exportToCSV } from '../../utils/csv';
import { Plus, Trash2, Download, Search } from 'lucide-react';

const ACTIVITY_TYPES = ['정기모임', '봉사활동', '특별활동', '기타'];

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [year, setYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ member_id: '', date: new Date().toISOString().slice(0, 10), type: '정기모임', note: '' });

  useEffect(() => { fetchData(); }, [year]);

  async function fetchData() {
    const [r, m] = await Promise.all([
      supabase.from('attendance').select('*').gte('date', `${year}-01-01`).lte('date', `${year}-12-31`).order('date', { ascending: false }),
      supabase.from('profiles').select('id, name').neq('status', 'withdrawn'),
    ]);
    setRecords(r.data || []);
    setMembers(m.data || []);
    setLoading(false);
  }

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m.name; });

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.member_id) return;
    await supabase.from('attendance').insert(form);
    setShowModal(false);
    setForm({ member_id: '', date: new Date().toISOString().slice(0, 10), type: '정기모임', note: '' });
    fetchData();
  }

  async function handleDelete(id) {
    await supabase.from('attendance').delete().eq('id', id);
    fetchData();
  }

  function handleExport() {
    exportToCSV(filtered, '출석기록.csv', [
      { label: '날짜', accessor: 'date' },
      { label: '회원명', accessor: a => memberMap[a.member_id] || '' },
      { label: '유형', accessor: 'type' },
      { label: '메모', accessor: 'note' },
    ]);
  }

  const filtered = records.filter(a => {
    const name = memberMap[a.member_id] || '';
    return (!search || name.includes(search)) && (typeFilter === 'all' || a.type === typeFilter);
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">출석 관리</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> 출석 추가
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
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <button onClick={handleExport} className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            <Download size={18} /> CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">날짜</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">회원명</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">유형</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">메모</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">출석 기록이 없습니다</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-600">{a.date}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{memberMap[a.member_id] || '(알 수 없음)'}</td>
                <td className="px-6 py-4"><span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{a.type}</span></td>
                <td className="px-6 py-4 text-gray-500 text-sm">{a.note || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(a.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="출석 기록 추가" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회원 *</label>
              <select required value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">선택</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
