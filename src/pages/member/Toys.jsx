// Created: 2026-03-22
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import { Package, Search } from 'lucide-react';

const STATUS_LABELS = { available: '대여가능', rented: '대여중', maintenance: '점검중' };
const CATEGORY_COLORS = { '영아': 'bg-pink-100 text-pink-700', '유아': 'bg-blue-100 text-blue-700', '초등': 'bg-green-100 text-green-700' };

export default function Toys() {
  const { profile } = useAuth();
  const [toys, setToys] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [renting, setRenting] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => { fetchData(); }, [profile]);

  async function fetchData() {
    if (!profile) return;
    const [t, r, c] = await Promise.all([
      supabase.from('toys').select('*').order('name'),
      supabase.from('toy_rentals').select('*').eq('member_id', profile.id).eq('status', 'rented'),
      supabase.from('children').select('*').eq('parent_id', profile.id),
    ]);
    setToys(t.data || []);
    setRentals(r.data || []);
    setChildren(c.data || []);
    setLoading(false);
  }

  function isRentedByMe(toyId) {
    return rentals.some(r => r.toy_id === toyId);
  }

  function getDefaultDueDate() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  }

  async function handleRent(toyId) {
    const payload = {
      toy_id: toyId,
      member_id: profile.id,
      child_id: selectedChild || null,
      due_date: dueDate || getDefaultDueDate(),
    };
    const { error } = await supabase.from('toy_rentals').insert(payload);
    if (!error) {
      await supabase.from('toys').update({ status: 'rented' }).eq('id', toyId);
      setRenting(null);
      setSelectedChild('');
      setDueDate('');
      fetchData();
    }
  }

  const filtered = toys.filter(t => !search || t.name.includes(search));

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">장난감 대여</h2>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="장난감 검색..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
      </div>

      {loading ? (
        <p className="text-gray-400">로딩 중...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">장난감이 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(toy => {
            const myRental = isRentedByMe(toy.id);
            return (
              <div key={toy.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {toy.image_url ? (
                  <img src={toy.image_url} alt={toy.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-indigo-50 flex items-center justify-center">
                    <Package size={48} className="text-indigo-200" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {toy.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[toy.category] || 'bg-gray-100 text-gray-700'}`}>
                        {toy.category}
                      </span>
                    )}
                    <StatusBadge status={toy.status} label={STATUS_LABELS[toy.status]} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mt-1">{toy.name}</h3>
                  {toy.description && <p className="text-sm text-gray-600 mt-1 mb-3">{toy.description}</p>}

                  {myRental ? (
                    <StatusBadge status="rented" label="대여중" />
                  ) : toy.status === 'available' ? (
                    renting === toy.id ? (
                      <div className="space-y-2 mt-3">
                        {children.length > 0 && (
                          <select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                            <option value="">본인 사용</option>
                            {children.map(c => <option key={c.id} value={c.id}>{c.name} ({c.birth_year}년생)</option>)}
                          </select>
                        )}
                        <input type="date" value={dueDate || getDefaultDueDate()} onChange={e => setDueDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
                        <div className="flex gap-2">
                          <button onClick={() => handleRent(toy.id)}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">대여 확인</button>
                          <button onClick={() => { setRenting(null); setSelectedChild(''); setDueDate(''); }}
                            className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">취소</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setRenting(toy.id)}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors mt-3">대여 신청</button>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
