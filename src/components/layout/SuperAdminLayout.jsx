// Created: 2026-03-28
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { LayoutDashboard, Building2, ArrowLeft, LogOut, Settings } from 'lucide-react';

const navItems = [
  { to: '/super-admin', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/super-admin/branches', icon: Building2, label: '호점 관리' },
];

export default function SuperAdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600">수눌음 시스템 관리</h1>
          <p className="text-sm text-gray-500 mt-1">{profile?.name || '관리자'}</p>
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
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-1">
          <NavLink to="/select-branch" className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={20} /> 호점 선택
          </NavLink>
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
