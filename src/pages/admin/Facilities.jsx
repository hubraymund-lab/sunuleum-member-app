// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

export default function AdminFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', capacity: 0 });

  useEffect(() => { fetchFacilities(); }, []);

  async function fetchFacilities() {
    const { data } = await supabase.from('facilities').select('*').order('name');
    setFacilities(data || []);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm({ name: '', description: '', capacity: 0 }); setShowModal(true); }
  function openEdit(f) { setEditing(f); setForm({ name: f.name, description: f.description || '', capacity: f.capacity || 0 }); setShowModal(true); }

  async function handleSave(e) {
    e.preventDefault();
    if (editing) await supabase.from('facilities').update(form).eq('id', editing.id);
    else await supabase.from('facilities').insert(form);
    setShowModal(false); fetchFacilities();
  }

  async function handleDelete() {
    if (deleteTarget) { await supabase.from('facilities').delete().eq('id', deleteTarget.id); setDeleteTarget(null); fetchFacilities(); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">시설 관리</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> 시설 추가
        </button>
      </div>

      {loading ? <p className="text-gray-400">로딩 중...</p> : facilities.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">등록된 시설이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{f.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(f)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
              {f.description && <p className="text-sm text-gray-500 mb-2">{f.description}</p>}
              {f.capacity > 0 && <p className="text-sm text-gray-400">수용인원: {f.capacity}명</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? '시설 수정' : '시설 추가'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시설명 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수용인원</label>
              <input type="number" min={0} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
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
        <ConfirmDialog title="시설 삭제" message={`"${deleteTarget.name}" 시설을 삭제하시겠습니까?`}
          confirmLabel="삭제" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
