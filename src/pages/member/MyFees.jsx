// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import StatusBadge from '../../components/common/StatusBadge';
import { Wallet, CheckCircle, AlertCircle } from 'lucide-react';

export default function MyFees() {
  const { branchId } = useParams();
  const { profile } = useAuth();
  const [fees, setFees] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFees(); }, [profile, year, branchId]);

  async function fetchFees() {
    if (!profile) return;
    const { data } = await supabase
      .from('fees')
      .select('*')
      .eq('branch_id', branchId)
      .eq('member_id', profile.id)
      .gte('month', `${year}-01`)
      .lte('month', `${year}-12`)
      .order('month', { ascending: false });
    setFees(data || []);
    setLoading(false);
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const paidCount = fees.filter(f => f.status === 'paid').length;
  const unpaidCount = fees.filter(f => f.status === 'unpaid').length;
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">회비 내역</h2>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
          <div className="bg-green-100 p-2 sm:p-3 rounded-lg"><CheckCircle size={20} className="text-green-600 sm:w-6 sm:h-6" /></div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-500">납부</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{paidCount}<span className="text-sm font-normal">월</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
          <div className="bg-red-100 p-2 sm:p-3 rounded-lg"><AlertCircle size={20} className="text-red-600 sm:w-6 sm:h-6" /></div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-500">미납</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{unpaidCount}<span className="text-sm font-normal">월</span></p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4">
          <div className="bg-indigo-100 p-2 sm:p-3 rounded-lg"><Wallet size={20} className="text-indigo-600 sm:w-6 sm:h-6" /></div>
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-500">총액</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{totalPaid.toLocaleString()}<span className="text-sm font-normal">원</span></p>
          </div>
        </div>
      </div>

      {/* Monthly grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">{year}년 납부 현황</h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            const month = `${year}-${String(i + 1).padStart(2, '0')}`;
            const fee = fees.find(f => f.month === month);
            const isPaid = fee?.status === 'paid';
            const isUnpaid = fee?.status === 'unpaid';
            return (
              <div key={month} className="text-center">
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-lg ${
                  isPaid ? 'bg-green-100 text-green-600' : isUnpaid ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-300'
                }`}>
                  {isPaid ? '✓' : isUnpaid ? '!' : '-'}
                </div>
                <p className="text-xs text-gray-500 mt-1">{i + 1}월</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-400 text-center">로딩 중...</p>
        ) : fees.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{year}년 회비 기록이 없습니다</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">월</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">금액</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">납부일</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fees.map(f => (
                    <tr key={f.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{f.month}</td>
                      <td className="px-6 py-4 text-gray-600">{f.amount.toLocaleString()}원</td>
                      <td className="px-6 py-4 text-gray-600">{f.paid_date || '-'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={f.status} label={f.status === 'paid' ? '납부' : '미납'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-200">
              {fees.map(f => (
                <div key={f.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{f.month}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">{f.amount.toLocaleString()}원</span>
                      {f.paid_date && <span className="text-xs text-gray-400">{f.paid_date}</span>}
                    </div>
                  </div>
                  <StatusBadge status={f.status} label={f.status === 'paid' ? '납부' : '미납'} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
