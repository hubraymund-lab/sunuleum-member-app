// Created: 2026-03-18
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, UserCheck, UserX, Wallet, BookOpen, Building2 } from 'lucide-react';

export default function AdminDashboard() {
  const { branchId } = useParams();
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, feeRate: 0, programs: 0, rentals: 0 });
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, [branchId]);

  async function fetchStats() {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // branch_members와 profiles를 분리 조회
    const [membershipsRes, profilesRes, fees, paidFees, programs, pendingRentals] = await Promise.all([
      supabase.from('branch_members').select('*').eq('branch_id', branchId),
      supabase.from('profiles').select('*'),
      supabase.from('fees').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).eq('month', currentMonth),
      supabase.from('fees').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).eq('month', currentMonth).eq('status', 'paid'),
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).eq('status', 'open'),
      supabase.from('rentals').select('id', { count: 'exact', head: true }).eq('branch_id', branchId).eq('status', 'pending'),
    ]);

    const memberships = membershipsRes.data || [];
    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));

    const totalFees = fees.count || 0;
    const paidTotal = paidFees.count || 0;

    setStats({
      total: memberships.length,
      active: memberships.filter(m => m.status === 'active').length,
      inactive: memberships.filter(m => m.status === 'inactive').length,
      feeRate: totalFees > 0 ? Math.round((paidTotal / totalFees) * 100) : 0,
      programs: programs.count || 0,
      rentals: pendingRentals.count || 0,
    });

    // 최근 가입 회원 (joined_at 기준 최신 5명)
    const recentList = memberships
      .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
      .slice(0, 5)
      .map(m => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      }));
    setRecentMembers(recentList);
    setLoading(false);
  }

  const cards = [
    { label: '전체 회원', value: stats.total, icon: Users, color: 'bg-blue-500' },
    { label: '활동 회원', value: stats.active, icon: UserCheck, color: 'bg-green-500' },
    { label: '휴면 회원', value: stats.inactive, icon: UserX, color: 'bg-yellow-500' },
    { label: '이번 달 납부율', value: `${stats.feeRate}%`, icon: Wallet, color: 'bg-indigo-500' },
    { label: '모집중 프로그램', value: stats.programs, icon: BookOpen, color: 'bg-purple-500' },
    { label: '대관 대기', value: stats.rentals, icon: Building2, color: 'bg-orange-500' },
  ];

  if (loading) return <p className="text-gray-400">로딩 중...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`${color} p-3 rounded-lg`}><Icon size={24} className="text-white" /></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 가입 회원</h3>
        {recentMembers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">회원이 없습니다</p>
        ) : (
          <ul className="space-y-3">
            {recentMembers.map(m => (
              <li key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium text-gray-900">{m.profile?.name || '(이름 미입력)'}</span>
                  <span className="text-sm text-gray-500 ml-2">{m.profile?.email}</span>
                </div>
                <span className="text-sm text-gray-400">{m.joined_at?.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
