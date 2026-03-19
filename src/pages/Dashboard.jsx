// Created: 2026-03-18
import { useApp } from '../context/AppContext';
import { formatDate, formatCurrency } from '../utils/helpers';
import { Users, UserCheck, UserX, Wallet, Clock, CalendarCheck } from 'lucide-react';

export default function Dashboard() {
  const { state } = useApp();
  const { members, attendance, fees } = state;

  const activeMembers = members.filter(m => m.status === 'active');
  const inactiveMembers = members.filter(m => m.status === 'inactive');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthFees = fees.filter(f => f.month === currentMonth);
  const paidCount = thisMonthFees.filter(f => f.status === 'paid').length;
  const feeRate = activeMembers.length > 0 ? Math.round((paidCount / activeMembers.length) * 100) : 0;

  const recentMembers = [...members].sort((a, b) => b.joinDate?.localeCompare(a.joinDate)).slice(0, 5);
  const recentAttendance = [...attendance].sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 5);

  const unpaidMembers = activeMembers.filter(m => {
    const paid = thisMonthFees.find(f => f.memberId === m.id && f.status === 'paid');
    return !paid;
  });

  const cards = [
    { label: '전체 회원', value: members.length, icon: Users, color: 'bg-blue-500' },
    { label: '활동 회원', value: activeMembers.length, icon: UserCheck, color: 'bg-green-500' },
    { label: '휴면 회원', value: inactiveMembers.length, icon: UserX, color: 'bg-yellow-500' },
    { label: '이번 달 납부율', value: `${feeRate}%`, icon: Wallet, color: 'bg-indigo-500' },
  ];

  function getMemberName(id) {
    return members.find(m => m.id === id)?.name || '(알 수 없음)';
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`${color} p-3 rounded-lg`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-indigo-500" /> 최근 등록 회원
          </h3>
          {recentMembers.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">등록된 회원이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {recentMembers.map(m => (
                <li key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="font-medium text-gray-900">{m.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{m.phone}</span>
                  </div>
                  <span className="text-sm text-gray-400">{formatDate(m.joinDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarCheck size={20} className="text-indigo-500" /> 최근 출석 기록
          </h3>
          {recentAttendance.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">출석 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {recentAttendance.map(a => (
                <li key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="font-medium text-gray-900">{getMemberName(a.memberId)}</span>
                    <span className="text-sm text-indigo-600 ml-2 bg-indigo-50 px-2 py-0.5 rounded">{a.type}</span>
                  </div>
                  <span className="text-sm text-gray-400">{formatDate(a.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {unpaidMembers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet size={20} className="text-red-500" /> 이번 달 미납 회원 ({unpaidMembers.length}명)
          </h3>
          <div className="flex flex-wrap gap-2">
            {unpaidMembers.map(m => (
              <span key={m.id} className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
