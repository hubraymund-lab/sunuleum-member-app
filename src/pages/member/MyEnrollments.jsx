// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import { BookOpen } from 'lucide-react';

const STATUS_LABELS = { enrolled: '참여중', cancelled: '취소', completed: '완료' };

export default function MyEnrollments() {
  const { profile } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEnrollments(); }, [profile]);

  async function fetchEnrollments() {
    if (!profile) return;
    const { data } = await supabase
      .from('enrollments')
      .select('*, program:programs(*), child:children(name, birth_year)')
      .eq('member_id', profile.id)
      .order('enrolled_at', { ascending: false });
    setEnrollments(data || []);
    setLoading(false);
  }

  async function handleCancel(id) {
    await supabase.from('enrollments').update({ status: 'cancelled' }).eq('id', id);
    fetchEnrollments();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">내 신청 목록</h2>

      {loading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">신청한 프로그램이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map(e => (
            <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{e.program?.title || '(삭제된 프로그램)'}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <StatusBadge status={e.status} label={STATUS_LABELS[e.status]} />
                  {e.child && <span className="text-sm text-gray-500">자녀: {e.child.name}</span>}
                  <span className="text-sm text-gray-400">{new Date(e.enrolled_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
              {e.status === 'enrolled' && (
                <button onClick={() => handleCancel(e.id)} className="text-sm text-red-500 hover:underline">취소</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
