// Created: 2026-03-18
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate } from '../utils/helpers';
import { exportToCSV } from '../utils/csv';
import { Search, Edit, Trash2, Download, X, UserPlus } from 'lucide-react';

const STATUS_LABELS = { active: '활동', inactive: '휴면', withdrawn: '탈퇴' };
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  withdrawn: 'bg-red-100 text-red-800',
};

const emptyForm = { name: '', phone: '', joinDate: new Date().toISOString().slice(0, 10), status: 'active' };

export default function Members() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = state.members.filter(m => {
    const matchSearch = m.name.includes(search) || m.phone.includes(search);
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openAdd() {
    setEditingMember(null);
    setForm({ ...emptyForm, joinDate: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  }

  function openEdit(member) {
    setEditingMember(member);
    setForm({ name: member.name, phone: member.phone, joinDate: member.joinDate, status: member.status });
    setShowModal(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingMember) {
      dispatch({ type: 'UPDATE_MEMBER', payload: { ...editingMember, ...form } });
    } else {
      dispatch({ type: 'ADD_MEMBER', payload: { id: generateId(), ...form } });
    }
    setShowModal(false);
  }

  function handleDelete() {
    if (deleteTarget) {
      dispatch({ type: 'DELETE_MEMBER', payload: deleteTarget.id });
      setDeleteTarget(null);
    }
  }

  function handleExport() {
    exportToCSV(filtered, '회원목록.csv', [
      { label: '이름', accessor: 'name' },
      { label: '연락처', accessor: 'phone' },
      { label: '가입일', accessor: 'joinDate' },
      { label: '상태', accessor: (m) => STATUS_LABELS[m.status] },
    ]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <UserPlus size={18} /> 회원 등록
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="이름 또는 연락처 검색..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="all">전체 상태</option>
            <option value="active">활동</option>
            <option value="inactive">휴면</option>
            <option value="withdrawn">탈퇴</option>
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
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">이름</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">연락처</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">가입일</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">등록된 회원이 없습니다.</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                <td className="px-6 py-4 text-gray-600">{m.phone}</td>
                <td className="px-6 py-4 text-gray-600">{formatDate(m.joinDate)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                    {STATUS_LABELS[m.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(m)} className="text-gray-400 hover:text-indigo-600 mr-3"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(m)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingMember ? '회원 정보 수정' : '회원 등록'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                <input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="active">활동</option>
                  <option value="inactive">휴면</option>
                  <option value="withdrawn">탈퇴</option>
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

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">회원 삭제</h3>
            <p className="text-gray-600 mb-6"><strong>{deleteTarget.name}</strong> 회원을 삭제하시겠습니까?</p>
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
