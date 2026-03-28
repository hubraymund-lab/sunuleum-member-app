// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { exportToCSV } from '../../utils/csv';
import { Search, Download, Edit, Trash2, Eye, Baby } from 'lucide-react';

const STATUS_LABELS = { active: '활동', inactive: '휴면', withdrawn: '탈퇴' };

export default function AdminMembers() {
  const { branchId } = useParams();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingMember, setEditingMember] = useState(null);
  const [detailMember, setDetailMember] = useState(null);
  const [children, setChildren] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', status: 'active' });

  useEffect(() => { fetchMembers(); }, [branchId]);

  const [debug, setDebug] = useState('');

  async function fetchMembers() {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: memberships, error: membershipsError } = await supabase
      .from('branch_members')
      .select('*')
      .eq('branch_id', branchId);

    // 디버그 정보
    setDebug(
      `branchId: ${branchId}\n` +
      `profiles: ${profiles?.length || 0}건 (에러: ${profilesError ? JSON.stringify(profilesError) : '없음'})\n` +
      `memberships: ${memberships?.length || 0}건 (에러: ${membershipsError ? JSON.stringify(membershipsError) : '없음'})\n` +
      `profiles IDs: ${(profiles || []).map(p => p.id.slice(0,8)).join(', ')}\n` +
      `memberships user_ids: ${(memberships || []).map(m => m.user_id.slice(0,8)).join(', ')}`
    );

    const memberMap = new Map((memberships || []).map(m => [m.user_id, m]));
    const merged = (profiles || [])
      .filter(p => memberMap.has(p.id))
      .map(p => {
        const bm = memberMap.get(p.id);
        return {
          id: bm.id,
          branch_id: bm.branch_id,
          role: bm.role,
          status: bm.status,
          joined_at: bm.joined_at,
          user_id: p.id,
          profile: p,
        };
      });

    setMembers(merged);
    setLoading(false);
  }

  async function viewDetail(member) {
    setDetailMember(member);
    const { data } = await supabase.from('children').select('*').eq('parent_id', member.profile?.id);
    setChildren(data || []);
  }

  function openEdit(member) {
    setEditingMember(member);
    setForm({ name: member.profile?.name || '', phone: member.profile?.phone || '', status: member.status, role: member.role || 'member' });
  }

  async function handleSave(e) {
    e.preventDefault();
    // Update profile info (name, phone)
    await supabase.from('profiles').update({ name: form.name, phone: form.phone }).eq('id', editingMember.profile?.id);
    // Update branch_members info (status, role)
    await supabase.from('branch_members').update({ status: form.status, role: form.role }).eq('id', editingMember.id);
    setEditingMember(null);
    fetchMembers();
  }

  async function handleDelete() {
    if (deleteTarget) {
      await supabase.from('branch_members').update({ status: 'withdrawn' }).eq('id', deleteTarget.id);
      setDeleteTarget(null);
      fetchMembers();
    }
  }

  function handleExport() {
    exportToCSV(filtered, '회원목록.csv', [
      { label: '이름', accessor: m => m.profile?.name || '' },
      { label: '이메일', accessor: m => m.profile?.email || '' },
      { label: '연락처', accessor: m => m.profile?.phone || '' },
      { label: '가입일', accessor: m => m.joined_at?.slice(0, 10) || '' },
      { label: '상태', accessor: m => STATUS_LABELS[m.status] },
    ]);
  }

  const filtered = members.filter(m => {
    const p = m.profile || {};
    const matchSearch = !search || p.name?.includes(search) || p.email?.includes(search) || p.phone?.includes(search);
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="이름, 이메일, 연락처 검색..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="all">전체</option>
            <option value="active">활동</option>
            <option value="inactive">휴면</option>
            <option value="withdrawn">탈퇴</option>
          </select>
          <button onClick={handleExport} className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
            <Download size={18} /> CSV
          </button>
        </div>
      </div>

      {/* 디버그 정보 (문제 해결 후 제거) */}
      {debug && (
        <pre className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4 text-xs text-gray-700 whitespace-pre-wrap">{debug}</pre>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">이름</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">이메일</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">연락처</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">가입일</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">회원이 없습니다</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{m.profile?.name || '(미입력)'}</td>
                <td className="px-6 py-4 text-gray-600 text-sm">{m.profile?.email}</td>
                <td className="px-6 py-4 text-gray-600">{m.profile?.phone || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{m.joined_at?.slice(0, 10)}</td>
                <td className="px-6 py-4"><StatusBadge status={m.status} label={STATUS_LABELS[m.status]} /></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => viewDetail(m)} className="text-gray-400 hover:text-indigo-600 mr-2"><Eye size={16} /></button>
                  <button onClick={() => openEdit(m)} className="text-gray-400 hover:text-indigo-600 mr-2"><Edit size={16} /></button>
                  <button onClick={() => setDeleteTarget(m)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detailMember && (
        <Modal title={`${detailMember.profile?.name || ''} 상세`} onClose={() => setDetailMember(null)} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">이메일:</span> <span className="text-gray-900">{detailMember.profile?.email}</span></div>
              <div><span className="text-gray-500">연락처:</span> <span className="text-gray-900">{detailMember.profile?.phone || '-'}</span></div>
              <div><span className="text-gray-500">가입일:</span> <span className="text-gray-900">{detailMember.joined_at?.slice(0, 10)}</span></div>
              <div><span className="text-gray-500">상태:</span> <StatusBadge status={detailMember.status} label={STATUS_LABELS[detailMember.status]} /></div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-2"><Baby size={16} /> 자녀 ({children.length}명)</h4>
              {children.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 자녀 없음</p>
              ) : (
                <ul className="space-y-1">
                  {children.map(c => (
                    <li key={c.id} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                      {c.name} ({c.birth_year}년생, {new Date().getFullYear() - c.birth_year}세)
                      {c.note && <span className="text-gray-400 ml-2">- {c.note}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editingMember && (
        <Modal title="회원 정보 수정" onClose={() => setEditingMember(null)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="member">회원</option>
                <option value="admin">관리자</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
              <button type="button" onClick={() => setEditingMember(null)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog title="회원 탈퇴 처리" message={`${deleteTarget.profile?.name || ''}을(를) 탈퇴 처리하시겠습니까?`}
          confirmLabel="탈퇴 처리" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
