// Created: 2026-03-22
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import { Package } from 'lucide-react';

const STATUS_LABELS = { rented: '대여중', returned: '반납완료', overdue: '연체' };
const CATEGORY_COLORS = { '영아': 'bg-pink-100 text-pink-700', '유아': 'bg-blue-100 text-blue-700', '초등': 'bg-green-100 text-green-700' };

export default function MyToyRentals() {
  const { branchId } = useParams();
  const { profile } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRentals(); }, [profile, branchId]);

  async function fetchRentals() {
    if (!profile) return;
    const { data } = await supabase
      .from('toy_rentals')
      .select('*, toy:toys(name, category), child:children(name)')
      .eq('branch_id', branchId)
      .eq('member_id', profile.id)
      .order('rented_at', { ascending: false });
    setRentals(data || []);
    setLoading(false);
  }

  async function handleReturn(rental) {
    const { error } = await supabase.from('toy_rentals')
      .update({ status: 'returned', returned_at: new Date().toISOString() })
      .eq('id', rental.id);
    if (!error) {
      await supabase.from('toys').update({ status: 'available' }).eq('id', rental.toy_id);
      fetchRentals();
    }
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">장난감 대여 내역</h2>

      {loading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : rentals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">대여 내역이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map(r => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.toy?.name || '(삭제된 장난감)'}</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                    <StatusBadge status={r.status} label={STATUS_LABELS[r.status]} />
                    {r.toy?.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.toy.category] || 'bg-gray-100 text-gray-700'}`}>
                        {r.toy.category}
                      </span>
                    )}
                    {r.child && <span className="text-sm text-gray-500">자녀: {r.child.name}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 mt-2">
                    <span>대여일: {new Date(r.rented_at).toLocaleDateString('ko-KR')}</span>
                    {r.due_date && <span>반납예정: {new Date(r.due_date).toLocaleDateString('ko-KR')}</span>}
                    {r.returned_at && <span>반납일: {new Date(r.returned_at).toLocaleDateString('ko-KR')}</span>}
                  </div>
                </div>
                {r.status === 'rented' && (
                  <button onClick={() => handleReturn(r)}
                    className="self-start sm:self-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">반납</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
