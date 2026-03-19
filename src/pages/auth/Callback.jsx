// Created: 2026-03-18
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 프로필 완성 여부 확인
        supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (!data?.name) {
              navigate('/auth/complete-profile', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          });
      }
    });
  }, [navigate]);

  return <LoadingSpinner />;
}
