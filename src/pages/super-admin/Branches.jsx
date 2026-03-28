// Created: 2026-03-28
import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { Plus, Edit, Trash2, Users, Shield, ChevronDown, ChevronUp, UserPlus, UserMinus } from 'lucide-react';

const STATUS_LABELS = { active: '운영중', inactive: '비활성' };
const emptyForm = { name: '', code: '', description: '', status: 'active' };

export default function SuperAdminBranches() {
  const [branches, setBranches] = useState([]);
  const [memberCounts, setMemberCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Branch detail / member management
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [branchMembers, setBranchMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Add member modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberBranchId, setAddMemberBranchId] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);

  useEffect(() => { fetchBranches(); }, []);

  async function fetchBranches() {
    const { data } = await supabase.from('branches').select('*').order('created_at');
    setBranches(data || []);

    const { data: members } = await supabase.from('branch_members').select('branch_id').eq('status', 'active');
    const counts = {};
    (members || []).forEach(m => { counts[m.branch_id] = (counts[m.branch_id] || 0) + 1; });
    setMemberCounts(counts);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(branch) {
    setEditing(branch);
    setForm({
      name: branch.name,
      code: branch.code || '',
      description: branch.description || '',
      status: branch.status,
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      await supabase.from('branches').update(form).eq('id', editing.id);
    } else {
      await supabase.from('branches').insert(form);
    }
    setShowModal(false);
    fetchBranches();
  }

  async function handleDelete() {
    if (deleteTarget) {
      await supabase.from('branches').delete().eq('id', deleteTarget.id);
      setDeleteTarget(null);
      fetchBranches();
    }
  }

  async function toggleStatus(branch) {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    await supabase.from('branches').update({ status: newStatus }).eq('id', branch.id);
    fetchBranches();
  }

  // Branch member management
  async function toggleBranchDetail(branchId) {
    if (expandedBranch === branchId) {
      setExpandedBranch(null);
      setBranchMembers([]);
      return;
    }
    setExpandedBranch(branchId);
    await fetchBranchMembers(branchId);
  }

  async function fetchBranchMembers(branchId) {
    setLoadingMembers(true);
    const { data, error } = await supabase
      .from('branch_members')
      .select('*, profile:profiles(id, name, email, phone)')
      .eq('branch_id', branchId)
      .eq('status', 'active')
      .order('joined_at');
    // 디버그용 알림 (문제 해결 후 제거)
    alert(`branchId: ${branchId}\n결과: ${data?.length || 0}건\n에러: ${error ? JSON.stringify(error) : '없음'}`);
    setBranchMembers(data || []);
    setLoadingMembers(false);
  }

  async function toggleMemberRole(member) {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    await supabase.from('branch_members').update({ role: newRole }).eq('id', member.id);
    fetchBranchMembers(member.branch_id);
  }

  async function openAddMember(branchId) {
    setAddMemberBranchId(branchId);
    setSearchQuery('');
    const { data } = await supabase.from('profiles').select('id, name, email, phone').order('name');
    setAllProfiles(data || []);
    setShowAddMember(true);
  }

  async function handleAddMember(profileId) {
    // Check if already a member
    const { data: existing } = await supabase
      .from('branch_members')
      .select('id')
      .eq('branch_id', addMemberBranchId)
      .eq('user_id', profileId)
      .single();

    if (existing) {
      alert('이미 이 호점의 회원입니다.');
      return;
    }

    await supabase.from('branch_members').insert({
      branch_id: addMemberBranchId,
      user_id: profileId,
      role: 'member',
      status: 'active',
    });
    setShowAddMember(false);
    fetchBranchMembers(addMemberBranchId);
    fetchBranches();
  }

  async function handleRemoveMember() {
    if (removeMemberTarget) {
      await supabase.from('branch_members').delete().eq('id', removeMemberTarget.id);
      setRemoveMemberTarget(null);
      fetchBranchMembers(expandedBranch);
      fetchBranches();
    }
  }

  const filteredProfiles = allProfiles.filter(p =>
    (p.name || '').includes(searchQuery) || (p.email || '').includes(searchQuery)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">호점 관리</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> 호점 추가
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">호점명</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">코드</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">회원수</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">로딩 중...</td></tr>
            ) : branches.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">호점이 없습니다</td></tr>
            ) : branches.map(b => (
              <Fragment key={b.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button onClick={() => toggleBranchDetail(b.id)} className="flex items-center gap-2 font-medium text-gray-900 hover:text-indigo-600">
                      {expandedBranch === b.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {b.name}
                    </button>
                    {b.description && <p className="text-xs text-gray-500 ml-6">{b.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.code || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Users size={14} /> {memberCounts[b.id] || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(b)}>
                      <StatusBadge status={b.status} label={STATUS_LABELS[b.status]} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(b)} className="text-gray-400 hover:text-indigo-600 mr-2"><Edit size={16} /></button>
                    <button onClick={() => setDeleteTarget(b)} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
                {expandedBranch === b.id && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">회원 목록</h4>
                        <button onClick={() => openAddMember(b.id)} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                          <UserPlus size={16} /> 회원 추가
                        </button>
                      </div>
                      {loadingMembers ? (
                        <p className="text-sm text-gray-400">로딩 중...</p>
                      ) : branchMembers.length === 0 ? (
                        <p className="text-sm text-gray-400">회원이 없습니다</p>
                      ) : (
                        <div className="space-y-2">
                          {branchMembers.map(m => (
                            <div key={m.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-gray-200">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{m.profile?.name || '알 수 없음'}</span>
                                <span className="text-xs text-gray-500 ml-2">{m.profile?.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleMemberRole(m)}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    m.role === 'admin'
                                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  <Shield size={12} className="inline mr-1" />
                                  {m.role === 'admin' ? '관리자' : '회원'}
                                </button>
                                <button
                                  onClick={() => setRemoveMemberTarget(m)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <UserMinus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Branch add/edit modal */}
      {showModal && (
        <Modal title={editing ? '호점 수정' : '호점 추가'} onClose={() => setShowModal(false)} maxWidth="max-w-lg">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">호점명 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">코드</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="예: branch-01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="active">운영중</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add member modal */}
      {showAddMember && (
        <Modal title="회원 추가" onClose={() => setShowAddMember(false)} maxWidth="max-w-lg">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="이름 또는 이메일로 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredProfiles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">검색 결과가 없습니다</p>
              ) : filteredProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAddMember(p.id)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">{p.name || '이름 없음'}</span>
                    <span className="text-xs text-gray-500 ml-2">{p.email}</span>
                  </div>
                  <UserPlus size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete branch confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="호점 삭제"
          message={`"${deleteTarget.name}" 호점을 삭제하시겠습니까? 관련 회원 데이터도 모두 삭제됩니다.`}
          confirmLabel="삭제" danger onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Remove member confirm */}
      {removeMemberTarget && (
        <ConfirmDialog
          title="회원 제거"
          message={`"${removeMemberTarget.profile?.name || '회원'}"을(를) 이 호점에서 제거하시겠습니까?`}
          confirmLabel="제거" danger onConfirm={handleRemoveMember} onCancel={() => setRemoveMemberTarget(null)}
        />
      )}
    </div>
  );
}
