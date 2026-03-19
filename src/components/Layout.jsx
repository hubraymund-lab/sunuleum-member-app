// Created: 2026-03-18
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, Wallet } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/members', icon: Users, label: '회원 관리' },
  { to: '/attendance', icon: CalendarCheck, label: '출석 관리' },
  { to: '/fees', icon: Wallet, label: '회비 관리' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600">수눌음</h1>
          <p className="text-sm text-gray-500">회원 관리 시스템</p>
        </div>
        <nav className="mt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50 border-r-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
