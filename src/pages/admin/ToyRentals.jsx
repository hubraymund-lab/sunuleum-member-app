// Created: 2026-03-22
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import { Package } from 'lucide-react';

const STATUS_LABELS = { rented: '대여중', returned: '반납', overdue: '연체' };

export default function AdminToyRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchRentals(); }, []);

  async function fetchRentals() {
    const { data } = await supabase.from('toy_rentals')
      .select('*, toy:toys(name, category), member:profiles(name, email), child:children(name)')
      .order('created_at', { ascending: false });
    setRentals(data || []);
    setLoading(false);
  }

  async function handleReturn(rental) {
    await supabase.from('toy_rentals').update({ status: 'returned', returned_at: new Date().toISOString() }).eq('id', rental.id);
    await supabase.from('toys').update({ status: 'available' }).eq('id', rental.toy_id);
    fetchRentals();
  }

  async function handleOverdue(rental) {
    await supabase.from('toy_rentals').update({ status: 'overdue' }).eq('id', rental.id);
    fetchRentals();
  }

  const filtered = rentals.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const filterButtons = [
    { key: 'all', label: '전체' },
    { key: 'rented', label: '대여중' },
    { key: 'returned', label: '반납' },
    { key: 'overdue', label: '연체' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">장난감 대여 관리</h2>
      </div>

      <div className="flex gap-2 mb-4">
        {filterButtons.map(fb => (
          <button key={fb.key} onClick={() => setStatusFilter(fb.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === fb.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {fb.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-gray-400">로딩 중...</p>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">대여 기록이 없습니다</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden sm:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">장난감</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">회원</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">자녀</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">대여일</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">반납예정일</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">반납일</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{r.toy?.name || '-'}</div>
                      <div className="text-sm text-gray-500">{r.toy?.category || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{r.member?.name || '-'}</div>
                      <div className="text-sm text-gray-500">{r.member?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.child?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.rented_at?.slice(0, 10) || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.due_date || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.returned_at?.slice(0, 10) || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} label={STATUS_LABELS[r.status]} /></td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'rented' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleReturn(r)}
                            className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors">반납 처리</button>
                          {r.due_date && new Date(r.due_date) < new Date() && (
                            <button onClick={() => handleOverdue(r)}
                              className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors">연체 처리</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-200">
              {filtered.map(r => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{r.toy?.name || '-'}</h3>
                      <p className="text-sm text-gray-500">{r.toy?.category || ''}</p>
                    </div>
                    <StatusBadge status={r.status} label={STATUS_LABELS[r.status]} />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p>회원: {r.member?.name || '-'}</p>
                    <p>자녀: {r.child?.name || '-'}</p>
                    <p>대여일: {r.rented_at?.slice(0, 10) || '-'}</p>
                    <p>반납예정일: {r.due_date || '-'}</p>
                    {r.returned_at && <p>반납일: {r.returned_at.slice(0, 10)}</p>}
                  </div>
                  {r.status === 'rented' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReturn(r)}
                        className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">반납 처리</button>
                      {r.due_date && new Date(r.due_date) < new Date() && (
                        <button onClick={() => handleOverdue(r)}
                          className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">연체 처리</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
