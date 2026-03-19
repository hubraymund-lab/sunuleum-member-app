// Created: 2026-03-18
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Home, User, Baby, BookOpen, CalendarCheck, Wallet, LogOut, Shield } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: '홈', end: true },
  { to: '/profile', icon: User, label: '내 프로필' },
  { to: '/children', icon: Baby, label: '자녀 관리' },
  { to: '/programs', icon: BookOpen, label: '프로그램' },
  { to: '/my/attendance', icon: CalendarCheck, label: '출석 내역' },
  { to: '/my/fees', icon: Wallet, label: '회비 내역' },
];

export default function MemberLayout() {
  const { profile, signOut, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600">수눌음</h1>
          <p className="text-sm text-gray-500 mt-1">{profile?.name || '회원'}님, 환영합니다</p>
        </div>
        <nav className="mt-2 flex-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50 border-r-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-indigo-600 bg-indigo-50 border-r-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }>
              <Shield size={20} />
              관리자 패널
            </NavLink>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={signOut} className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-600 hover:text-red-600 w-full transition-colors">
            <LogOut size={20} /> 로그아웃
          </button>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
