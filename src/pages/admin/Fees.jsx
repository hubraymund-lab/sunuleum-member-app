// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { exportToCSV } from '../../utils/csv';
import { Plus, Edit, Trash2, Download, Search } from 'lucide-react';

export default function AdminFees() {
  const [fees, setFees] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ member_id: '', month: new Date().toISOString().slice(0, 7), amount: 10000, paid_date: '', status: 'unpaid' });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [f, m] = await Promise.all([
      supabase.from('fees').select('*').order('month', { ascending: false }),
      supabase.from('profiles').select('id, name').neq('status', 'withdrawn'),
    ]);
    setFees(f.data || []);
    setMembers(m.data || []);
    setLoading(false);
  }

  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = m.name; });

  function openAdd() { setEditing(null); setForm({ member_id: '', month: monthFilter, amount: 10000, paid_date: '', status: 'unpaid' }); setShowModal(true); }
  function openEdit(f) {
    setEditing(f);
    setForm({ member_id: f.member_id, month: f.month, amount: f.amount, paid_date: f.paid_date || '', status: f.status });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const data = { ...form, status: form.paid_date ? 'paid' : form.status };
    if (editing) await supabase.from('fees').update(data).eq('id', editing.id);
    else await supabase.from('fees').insert(data);
    setShowModal(false); fetchData();
  }

  async function handleDelete() {
    if (deleteTarget) { await supabase.from('fees').delete().eq('id', deleteTarget.id); setDeleteTarget(null); fetchData(); }
  }

  const filtered = fees.filter(f => {
    const name = memberMap[f.member_id] || '';
    return (!search || name.includes(search)) && (!monthFilter || f.month === monthFilter) && (statusFilter === 'all' || f.status === statusFilter);
  });

  function handleExport() {
    exportToCSV(filtered, '회비현황.csv', [
      { label: '회원명', accessor: f => memberMap[f.member_id] || '' },
      { label: '월', accessor: 'month' },
      { label: '금액', accessor: 'amount' },
      { label: '납부일', accessor: f => f.paid_date || '' },
      { label: '상태', accessor: f => f.status === 'paid' ? '납부' : '미납' },
    ]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">회비 관리</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> 납부 기록 추가
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="회원명 검색..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="all">전체</option>
            <option value="paid">납부</option>
            <option value="unpaid">미납</option>
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
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">회원명</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">월</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">금액</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">납부일</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">기록 없음</td></tr>
            ) : filtered.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{memberMap[f.member_id] || '(알 수 없음)'}</td>
                <td className="px-6 py-4 text-gray-600">{f.month}</td>
                <td className="px-6 py-4 text-gray-600">{f.amount.toLocaleString()}원</td>
                <td className="px-6 py-4 text-gray-600">{f.paid_date || '-'}</td>
                <td className="px-6 py-4"><StatusBadge status={f.status} label={f.status === 'paid' ? '납부' : '미납'} /></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(f)} className="text-gray-400 hover:text-indigo-600 mr-2"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(f)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? '납부 기록 수정' : '납부 기록 추가'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회원 *</label>
              <select required value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">선택</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
              <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">납부일</label>
              <input type="date" value={form.paid_date} onChange={e => setForm({ ...form, paid_date: e.target.value, status: e.target.value ? 'paid' : 'unpaid' })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog title="납부 기록 삭제" message="이 기록을 삭제하시겠습니까?"
          confirmLabel="삭제" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
