// Created: 2026-03-22
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';

const STATUS_LABELS = { available: '대여가능', rented: '대여중', maintenance: '점검중' };
const CATEGORIES = ['일반', '교육', '야외', '퍼즐', '블록', '인형'];

export default function AdminToys() {
  const { branchId } = useParams();
  const [toys, setToys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: '일반', image_url: '', status: 'available' });

  useEffect(() => { fetchToys(); }, [branchId]);

  async function fetchToys() {
    const { data } = await supabase.from('toys').select('*').eq('branch_id', branchId).order('created_at', { ascending: false });
    setToys(data || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm({ name: '', description: '', category: '일반', image_url: '', status: 'available' }); setShowModal(true); }
  function openEdit(t) { setEditing(t); setForm({ name: t.name, description: t.description || '', category: t.category || '일반', image_url: t.image_url || '', status: t.status || 'available' }); setShowModal(true); }

  async function handleSave(e) {
    e.preventDefault();
    if (editing) await supabase.from('toys').update(form).eq('id', editing.id);
    else await supabase.from('toys').insert({ ...form, branch_id: branchId });
    setShowModal(false); fetchToys();
  }

  async function handleDelete() {
    if (deleteTarget) { await supabase.from('toys').delete().eq('id', deleteTarget.id); setDeleteTarget(null); fetchToys(); }
  }

  const filtered = toys.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">장난감 관리</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> 장난감 추가
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="장난감 이름으로 검색..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>

      {loading ? <p className="text-gray-400">로딩 중...</p> : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">등록된 장난감이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(t)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
              {t.description && <p className="text-sm text-gray-500 mb-2">{t.description}</p>}
              <div className="flex items-center justify-between mt-3">
                {t.category && <span className="text-sm text-gray-400">{t.category}</span>}
                <StatusBadge status={t.status} label={STATUS_LABELS[t.status]} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? '장난감 수정' : '장난감 추가'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
              <input type="text" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog title="장난감 삭제" message={`"${deleteTarget.name}" 장난감을 삭제하시겠습니까?`}
          confirmLabel="삭제" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
