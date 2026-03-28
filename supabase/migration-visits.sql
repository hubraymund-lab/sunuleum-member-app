-- Created: 2026-03-28
-- 수눌음 회원 관리 시스템 - QR 기반 방문 체크인 마이그레이션
-- 전제: migration-multi-branch.sql 이 먼저 적용되어 있어야 함
--       (branches 테이블, is_branch_admin 등 헬퍼 함수 필요)

BEGIN;

-- ============================================
-- 1. 방문 테이블 (visits)
-- ============================================
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'manual')),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. 인덱스
-- ============================================

-- 지점별 방문일시 조회 최적화
CREATE INDEX idx_visits_branch_date ON visits(branch_id, visited_at DESC);

-- 회원별 방문일시 조회 최적화
CREATE INDEX idx_visits_user ON visits(user_id, visited_at DESC);

-- 같은 날 중복 체크인 방지 (지점 + 회원 + 날짜)
CREATE UNIQUE INDEX idx_visits_unique_daily ON visits(branch_id, user_id, (visited_at::date));

-- ============================================
-- 3. RLS (Row Level Security) 정책
-- ============================================
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- 본인 방문 기록 조회
CREATE POLICY "본인 방문 조회" ON visits
  FOR SELECT USING (user_id = auth.uid());

-- 호점 관리자 방문 조회
CREATE POLICY "호점 관리자 방문 조회" ON visits
  FOR SELECT USING (is_branch_admin(branch_id));

-- 본인 방문 체크인 (QR)
CREATE POLICY "본인 방문 체크인" ON visits
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 호점 관리자 방문 관리 (수동 등록/삭제)
CREATE POLICY "호점 관리자 방문 관리" ON visits
  FOR ALL USING (is_branch_admin(branch_id));

COMMIT;
