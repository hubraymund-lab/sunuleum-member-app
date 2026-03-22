// Created: 2026-03-18
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Home, User, Baby, BookOpen, CalendarCheck, Wallet, LogOut, Shield, Menu, X, Package } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: '홈', end: true },
  { to: '/profile', icon: User, label: '내 프로필' },
  { to: '/children', icon: Baby, label: '자녀 관리' },
  { to: '/programs', icon: BookOpen, label: '프로그램' },
  { to: '/toys', icon: Package, label: '장난감 대여' },
  { to: '/my/attendance', icon: CalendarCheck, label: '출석 내역' },
  { to: '/my/fees', icon: Wallet, label: '회비 내역' },
];

export default function MemberLayout() {
  const { profile, signOut, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
      isActive ? 'text-indigo-600 bg-indigo-50 border-r-2 border-indigo-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;

  const sidebarContent = (
    <>
      <div className="p-6">
        <h1 className="text-xl font-bold text-indigo-600">수눌음</h1>
        <p className="text-sm text-gray-500 mt-1">{profile?.name || '회원'}님, 환영합니다</p>
      </div>
      <nav className="mt-2 flex-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}
            onClick={() => setSidebarOpen(false)}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={navLinkClass}
            onClick={() => setSidebarOpen(false)}>
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
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-indigo-600">수눌음</h1>
        <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-gray-600 hover:text-gray-900">
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - desktop: fixed, mobile: slide-in drawer */}
      <aside className={`
        fixed h-full bg-white border-r border-gray-200 flex flex-col z-50
        w-64 transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Mobile close button */}
        <button onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
