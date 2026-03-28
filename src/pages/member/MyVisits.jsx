// Created: 2026-03-28
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { MapPin, QrCode, Edit3 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function MyVisits() {
  const { branchId } = useParams();
  const { profile } = useAuth();

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['my-visits', branchId, profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('visits')
        .select('*')
        .eq('branch_id', branchId)
        .eq('user_id', profile.id)
        .order('visited_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.id,
  });

  if (isLoading) return <LoadingSpinner />;

  // Group visits by month
  const grouped = visits.reduce((acc, visit) => {
    const month = new Date(visit.visited_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(visit);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">방문 내역</h1>

      {visits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">방문 내역이 없습니다.</p>
          <p className="text-sm text-gray-400 mt-1">QR 코드를 스캔하여 방문 체크인을 해주세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthVisits]) => (
            <div key={month}>
              <h2 className="text-sm font-semibold text-gray-500 mb-3">{month} ({monthVisits.length}회)</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {monthVisits.map(visit => (
                  <div key={visit.id} className="flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      visit.method === 'qr' ? 'bg-indigo-50' : 'bg-gray-50'
                    }`}>
                      {visit.method === 'qr' ? (
                        <QrCode className="text-indigo-500" size={20} />
                      ) : (
                        <Edit3 className="text-gray-500" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(visit.visited_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(visit.visited_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{visit.method === 'qr' ? 'QR 체크인' : '수동 등록'}
                      </p>
                    </div>
                    {visit.note && (
                      <p className="text-xs text-gray-400">{visit.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
