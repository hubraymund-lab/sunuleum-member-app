// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Baby } from 'lucide-react';

export default function Children() {
  const { profile } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', birth_year: new Date().getFullYear(), note: '' });

  useEffect(() => { fetchChildren(); }, [profile]);

  async function fetchChildren() {
    if (!profile) return;
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', profile.id)
      .order('birth_year', { ascending: true });
    setChildren(data || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', birth_year: new Date().getFullYear(), note: '' });
    setShowModal(true);
  }

  function openEdit(child) {
    setEditing(child);
    setForm({ name: child.name, birth_year: child.birth_year, note: child.note || '' });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editing) {
      await supabase.from('children').update(form).eq('id', editing.id);
    } else {
      await supabase.from('children').insert({ ...form, parent_id: profile.id });
    }
    setShowModal(false);
    fetchChildren();
  }

  async function handleDelete() {
    if (deleteTarget) {
      await supabase.from('children').delete().eq('id', deleteTarget.id);
      setDeleteTarget(null);
      fetchChildren();
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">자녀 관리</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base">
          <Plus size={18} /> 추가
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : children.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Baby size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">등록된 자녀가 없습니다</p>
          <button onClick={openAdd} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">자녀 추가하기</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map(child => (
            <div key={child.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Baby size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-500">{child.birth_year}년생 ({currentYear - child.birth_year}세)</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(child)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(child)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
              {child.note && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{child.note}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? '자녀 정보 수정' : '자녀 추가'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">출생연도 *</label>
              <input type="number" required min={1990} max={currentYear} value={form.birth_year}
                onChange={e => setForm({ ...form, birth_year: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} placeholder="선택 사항"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="자녀 삭제"
          message={`${deleteTarget.name}을(를) 삭제하시겠습니까?`}
          confirmLabel="삭제"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
