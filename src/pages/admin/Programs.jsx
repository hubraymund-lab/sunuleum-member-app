// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

const STATUS_LABELS = { open: '모집중', closed: '마감', cancelled: '취소' };
const emptyForm = { title: '', description: '', category: '정기', start_date: '', end_date: '', capacity: 0, fee: 0, status: 'open' };

export default function AdminPrograms() {
  const { profile } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [enrollCounts, setEnrollCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchPrograms(); }, []);

  async function fetchPrograms() {
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    setPrograms(data || []);

    // Get enrollment counts
    const { data: enrollments } = await supabase.from('enrollments').select('program_id').eq('status', 'enrolled');
    const counts = {};
    (enrollments || []).forEach(e => { counts[e.program_id] = (counts[e.program_id] || 0) + 1; });
    setEnrollCounts(counts);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(prog) {
    setEditing(prog);
    setForm({
      title: prog.title, description: prog.description || '', category: prog.category || '정기',
      start_date: prog.start_date || '', end_date: prog.end_date || '',
      capacity: prog.capacity || 0, fee: prog.fee || 0, status: prog.status,
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editing) {
      await supabase.from('programs').update(form).eq('id', editing.id);
    } else {
      await supabase.from('programs').insert({ ...form, created_by: profile.id });
    }
    setShowModal(false);
    fetchPrograms();
  }

  async function handleDelete() {
    if (deleteTarget) {
      await supabase.from('programs').delete().eq('id', deleteTarget.id);
      setDeleteTarget(null);
      fetchPrograms();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">프로그램 관리</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> 프로그램 추가
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">프로그램명</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">카테고리</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">기간</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">신청</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
            ) : programs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">프로그램이 없습니다</td></tr>
            ) : programs.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{p.title}</div>
                  {p.fee > 0 && <span className="text-xs text-gray-500">{p.fee.toLocaleString()}원</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.start_date || '-'} ~ {p.end_date || ''}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Users size={14} /> {enrollCounts[p.id] || 0}{p.capacity > 0 ? `/${p.capacity}` : ''}
                  </span>
                </td>
                <td className="px-6 py-4"><StatusBadge status={p.status} label={STATUS_LABELS[p.status]} /></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-indigo-600 mr-2"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(p)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? '프로그램 수정' : '프로그램 추가'} onClose={() => setShowModal(false)} maxWidth="max-w-lg">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로그램명 *</label>
              <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="정기">정기</option>
                  <option value="특별">특별</option>
                  <option value="봉사">봉사</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="open">모집중</option>
                  <option value="closed">마감</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정원 (0=무제한)</label>
                <input type="number" min={0} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">참가비 (원)</label>
                <input type="number" min={0} value={form.fee} onChange={e => setForm({ ...form, fee: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog title="프로그램 삭제" message={`"${deleteTarget.title}" 프로그램을 삭제하시겠습니까? 관련 신청도 모두 삭제됩니다.`}
          confirmLabel="삭제" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
