// Created: 2026-03-18
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { BookOpen, Baby, CalendarCheck, Wallet, ArrowRight, Package, Building2 } from 'lucide-react';

export default function Home() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ programs: 0, children: 0, attendance: 0 });

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('programs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('children').select('id', { count: 'exact', head: true }).eq('parent_id', profile.id),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('member_id', profile.id).eq('status', 'enrolled'),
    ]).then(([programs, children, enrollments]) => {
      setStats({
        programs: programs.count || 0,
        children: children.count || 0,
        enrollments: enrollments.count || 0,
      });
    });
  }, [profile]);

  const quickLinks = [
    { to: '/programs', icon: BookOpen, label: '프로그램 둘러보기', desc: `${stats.programs}개 프로그램 모집 중`, color: 'bg-indigo-500' },
    { to: '/children', icon: Baby, label: '자녀 관리', desc: `${stats.children}명 등록`, color: 'bg-pink-500' },
    { to: '/my/attendance', icon: CalendarCheck, label: '출석 내역', desc: '올해 출석 기록 보기', color: 'bg-green-500' },
    { to: '/my/fees', icon: Wallet, label: '회비 내역', desc: '납부 현황 확인', color: 'bg-amber-500' },
    { to: '/toys', icon: Package, label: '장난감 대여', desc: '장난감 목록 및 대여 신청', color: 'bg-orange-500' },
    { to: '/rental-request', icon: Building2, label: '대관 신청', desc: '시설 대관 신청하기', color: 'bg-teal-500' },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">안녕하세요, {profile?.name || '회원'}님!</h2>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">수눌음에 오신 것을 환영합니다</p>
      </div>

      {stats.enrollments > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <p className="text-indigo-800 text-sm font-medium">
            현재 <strong>{stats.enrollments}개</strong> 프로그램에 참여 중입니다.
            <Link to="/my/enrollments" className="ml-2 underline">확인하기</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {quickLinks.map(({ to, icon: Icon, label, desc, color }) => (
          <Link key={to} to={to} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow group active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`${color} p-2.5 sm:p-3 rounded-lg`}>
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{label}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-500 transition-colors mt-1 hidden sm:block" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
