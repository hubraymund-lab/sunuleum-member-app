// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import { BookOpen, Users, Calendar, Search } from 'lucide-react';

const STATUS_LABELS = { open: '모집중', closed: '마감', cancelled: '취소' };
const CATEGORY_COLORS = { '정기': 'bg-blue-100 text-blue-700', '특별': 'bg-purple-100 text-purple-700', '봉사': 'bg-green-100 text-green-700' };

export default function Programs() {
  const { profile } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');

  useEffect(() => { fetchData(); }, [profile]);

  async function fetchData() {
    if (!profile) return;
    const [p, e, c] = await Promise.all([
      supabase.from('programs').select('*').order('start_date', { ascending: false }),
      supabase.from('enrollments').select('*').eq('member_id', profile.id),
      supabase.from('children').select('*').eq('parent_id', profile.id),
    ]);
    setPrograms(p.data || []);
    setEnrollments(e.data || []);
    setChildren(c.data || []);
    setLoading(false);
  }

  function isEnrolled(programId) {
    return enrollments.some(e => e.program_id === programId && e.status === 'enrolled');
  }

  function getEnrolledCount(programId) {
    // This would ideally be a count from the server
    return enrollments.filter(e => e.program_id === programId).length;
  }

  async function handleEnroll(programId) {
    const payload = {
      program_id: programId,
      member_id: profile.id,
      child_id: selectedChild || null,
    };
    const { error } = await supabase.from('enrollments').insert(payload);
    if (!error) {
      setEnrolling(null);
      setSelectedChild('');
      fetchData();
    }
  }

  async function handleCancel(programId) {
    await supabase.from('enrollments')
      .update({ status: 'cancelled' })
      .eq('program_id', programId)
      .eq('member_id', profile.id)
      .eq('status', 'enrolled');
    fetchData();
  }

  const filtered = programs.filter(p => !search || p.title.includes(search) || p.description?.includes(search));

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">프로그램</h2>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="프로그램 검색..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
      </div>

      {loading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">프로그램이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(prog => {
            const enrolled = isEnrolled(prog.id);
            return (
              <div key={prog.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {prog.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[prog.category] || 'bg-gray-100 text-gray-700'}`}>
                          {prog.category}
                        </span>
                      )}
                      <StatusBadge status={prog.status} label={STATUS_LABELS[prog.status]} />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{prog.title}</h3>
                  </div>
                </div>

                {prog.description && <p className="text-sm text-gray-600 mb-3">{prog.description}</p>}

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-4">
                  {prog.start_date && (
                    <span className="flex items-center gap-1"><Calendar size={14} /> {prog.start_date} ~ {prog.end_date || ''}</span>
                  )}
                  {prog.capacity > 0 && (
                    <span className="flex items-center gap-1"><Users size={14} /> 정원 {prog.capacity}명</span>
                  )}
                </div>

                {prog.fee > 0 && <p className="text-sm font-medium text-indigo-600 mb-3">참가비: {prog.fee.toLocaleString()}원</p>}

                {enrolled ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-green-600 font-medium">신청 완료</span>
                    <button onClick={() => handleCancel(prog.id)} className="text-sm text-red-500 hover:underline">취소</button>
                  </div>
                ) : prog.status === 'open' ? (
                  enrolling === prog.id ? (
                    <div className="space-y-2">
                      {children.length > 0 && (
                        <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                          <option value="">본인 참여</option>
                          {children.map(c => <option key={c.id} value={c.id}>{c.name} ({c.birth_year}년생)</option>)}
                        </select>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleEnroll(prog.id)}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">신청 확인</button>
                        <button onClick={() => setEnrolling(null)}
                          className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">취소</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setEnrolling(prog.id)}
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">신청하기</button>
                  )
                ) : (
                  <p className="text-sm text-gray-400">모집 마감</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
