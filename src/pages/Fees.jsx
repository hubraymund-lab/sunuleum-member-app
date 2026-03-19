// Created: 2026-03-18
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate, formatCurrency } from '../utils/helpers';
import { exportToCSV } from '../utils/csv';
import { Plus, Edit, Trash2, Download, Search, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function Fees() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ memberId: '', month: new Date().toISOString().slice(0, 7), amount: 10000, paidDate: '', status: 'unpaid' });

  const activeMembers = state.members.filter(m => m.status !== 'withdrawn');

  function getMemberName(id) {
    return state.members.find(m => m.id === id)?.name || '(알 수 없음)';
  }

  const filtered = state.fees
    .filter(f => {
      const name = getMemberName(f.memberId);
      const matchSearch = !search || name.includes(search);
      const matchMonth = !monthFilter || f.month === monthFilter;
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchSearch && matchMonth && matchStatus;
    })
    .sort((a, b) => b.month.localeCompare(a.month));

  // Summary for selected month
  const monthFees = state.fees.filter(f => f.month === monthFilter);
  const totalPaid = monthFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0);
  const unpaidCount = monthFees.filter(f => f.status === 'unpaid').length;
  const paidCount = monthFees.filter(f => f.status === 'paid').length;
  const paymentRate = monthFees.length > 0 ? Math.round((paidCount / monthFees.length) * 100) : 0;

  const unpaidMembers = monthFees.filter(f => f.status === 'unpaid').map(f => getMemberName(f.memberId));

  function openAdd() {
    setEditingFee(null);
    setForm({ memberId: '', month: monthFilter || new Date().toISOString().slice(0, 7), amount: 10000, paidDate: '', status: 'unpaid' });
    setShowModal(true);
  }

  function openEdit(fee) {
    setEditingFee(fee);
    setForm({ memberId: fee.memberId, month: fee.month, amount: fee.amount, paidDate: fee.paidDate || '', status: fee.status });
    setShowModal(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.memberId) return;
    const data = { ...form, status: form.paidDate ? 'paid' : form.status };
    if (editingFee) {
      dispatch({ type: 'UPDATE_FEE', payload: { ...editingFee, ...data } });
    } else {
      dispatch({ type: 'ADD_FEE', payload: { id: generateId(), ...data } });
    }
    setShowModal(false);
  }

  function handleDelete() {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_FEE', payload: deleteTarget.id });
      setDeleteTarget(null);
    }
  }

  function handleExport() {
    exportToCSV(filtered, '회비현황.csv', [
      { label: '회원명', accessor: (f) => getMemberName(f.memberId) },
      { label: '월', accessor: 'month' },
      { label: '금액', accessor: 'amount' },
      { label: '납부일', accessor: (f) => f.paidDate || '' },
      { label: '상태', accessor: (f) => f.status === 'paid' ? '납부' : '미납' },
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

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg"><CheckCircle size={24} className="text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">총 납부액</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg"><AlertCircle size={24} className="text-red-600" /></div>
          <div>
            <p className="text-sm text-gray-500">미납 건수</p>
            <p className="text-xl font-bold text-gray-900">{unpaidCount}건</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-lg">
            <div className="w-6 h-6 flex items-center justify-center text-indigo-600 font-bold text-sm">%</div>
          </div>
          <div>
            <p className="text-sm text-gray-500">납부율</p>
            <p className="text-xl font-bold text-gray-900">{paymentRate}%</p>
          </div>
        </div>
      </div>

      {/* Filters */}
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
            <option value="all">전체 상태</option>
            <option value="paid">납부</option>
            <option value="unpaid">미납</option>
          </select>
          <button onClick={handleExport} className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            <Download size={18} /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">회비 기록이 없습니다.</td></tr>
              ) : filtered.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{getMemberName(f.memberId)}</td>
                  <td className="px-6 py-4 text-gray-600">{f.month}</td>
                  <td className="px-6 py-4 text-gray-600">{formatCurrency(f.amount)}</td>
                  <td className="px-6 py-4 text-gray-600">{f.paidDate ? formatDate(f.paidDate) : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      f.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {f.status === 'paid' ? '납부' : '미납'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(f)} className="text-gray-400 hover:text-indigo-600 mr-3"><Edit size={16} /></button>
                    <button onClick={() => setDeleteTarget(f)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Unpaid members */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-red-500" /> 미납 회원
          </h3>
          {unpaidMembers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">미납 회원이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {unpaidMembers.map((name, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-gray-700">{name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingFee ? '납부 기록 수정' : '납부 기록 추가'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회원 선택 *</label>
                <select required value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">선택하세요</option>
                  {activeMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
                <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원)</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">납부일 (입력 시 자동 납부 처리)</label>
                <input type="date" value={form.paidDate} onChange={e => setForm({ ...form, paidDate: e.target.value, status: e.target.value ? 'paid' : 'unpaid' })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select value={form.paidDate ? 'paid' : form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  disabled={!!form.paidDate}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100">
                  <option value="paid">납부</option>
                  <option value="unpaid">미납</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">납부 기록 삭제</h3>
            <p className="text-gray-600 mb-6">이 납부 기록을 삭제하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors">삭제</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
