-- Created: 2026-03-28
-- 수눌음 회원 관리 시스템 - 멀티 지점 마이그레이션
-- 기존 단일 지점 → 멀티 지점 구조로 전환

BEGIN;

-- ============================================
-- 1. 새 테이블: branches (지점)
-- ============================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. 새 테이블: branch_members (지점 회원)
-- ============================================
CREATE TABLE branch_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch_id, user_id)
);

-- ============================================
-- 3. profiles 테이블에 system_role 컬럼 추가
-- ============================================
ALTER TABLE profiles
  ADD COLUMN system_role TEXT NOT NULL DEFAULT 'user'
  CHECK (system_role IN ('user', 'super_admin'));

-- ============================================
-- 4. 기존 테이블에 branch_id 컬럼 추가 (nullable)
-- ============================================
ALTER TABLE programs    ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE enrollments ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE facilities  ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE rentals     ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE attendance  ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE fees        ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE toys        ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE toy_rentals ADD COLUMN branch_id UUID REFERENCES branches(id);

-- ============================================
-- 5. 시범 지점 삽입 & 기존 데이터 백필
-- ============================================
DO $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- 시범 지점 생성
  INSERT INTO branches (name, code, description)
  VALUES ('육아 나눔터 6호점', 'branch-6', '수눌음 육아 나눔터 6호점 (시범 운영)')
  RETURNING id INTO v_branch_id;

  -- 기존 데이터에 시범 지점 연결
  UPDATE programs    SET branch_id = v_branch_id WHERE branch_id IS NULL;
  UPDATE enrollments SET branch_id = v_branch_id WHERE branch_id IS NULL;
  UPDATE facilities  SET branch_id = v_branch_id WHERE branch_id IS NULL;
  UPDATE rentals     SET branch_id = v_branch_id WHERE branch_id IS NULL;
  UPDATE attendance  SET branch_id = v_branch_id WHERE branch_id IS NULL;
  UPDATE fees        SET branch_id = v_branch_id WHERE branch_id IS NULL;
  UPDATE toys        SET branch_id = v_branch_id WHERE branch_id IS NULL;
  UPDATE toy_rentals SET branch_id = v_branch_id WHERE branch_id IS NULL;
END;
$$;

-- ============================================
-- 6. branch_id를 NOT NULL로 변경
-- ============================================
ALTER TABLE programs    ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE enrollments ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE facilities  ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE rentals     ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE attendance  ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE fees        ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE toys        ALTER COLUMN branch_id SET NOT NULL;
ALTER TABLE toy_rentals ALTER COLUMN branch_id SET NOT NULL;

-- ============================================
-- 7. 기존 회원을 branch_members로 마이그레이션
-- ============================================
INSERT INTO branch_members (branch_id, user_id, role)
SELECT
  (SELECT id FROM branches WHERE code = 'branch-6'),
  id,
  CASE WHEN role = 'admin' THEN 'admin' ELSE 'member' END
FROM profiles;

-- ============================================
-- 8. 헬퍼 함수
-- ============================================

-- 슈퍼 관리자 여부
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND system_role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 지점 관리자 여부 (슈퍼 관리자 포함)
CREATE OR REPLACE FUNCTION is_branch_admin(p_branch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin() OR EXISTS (
    SELECT 1 FROM branch_members
    WHERE user_id = auth.uid() AND branch_id = p_branch_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 지점 회원 여부 (슈퍼 관리자 포함)
CREATE OR REPLACE FUNCTION is_branch_member(p_branch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_super_admin() OR EXISTS (
    SELECT 1 FROM branch_members
    WHERE user_id = auth.uid() AND branch_id = p_branch_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 9. RLS: branches
-- ============================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "누구나 지점 조회" ON branches
  FOR SELECT USING (true);

CREATE POLICY "슈퍼관리자 지점 관리" ON branches
  FOR ALL USING (is_super_admin());

-- ============================================
-- 10. RLS: branch_members
-- ============================================
ALTER TABLE branch_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 소속 조회" ON branch_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "지점관리자 소속 조회" ON branch_members
  FOR SELECT USING (is_branch_admin(branch_id));

CREATE POLICY "슈퍼관리자 소속 관리" ON branch_members
  FOR ALL USING (is_super_admin());

CREATE POLICY "지점관리자 소속 추가" ON branch_members
  FOR INSERT WITH CHECK (is_branch_admin(branch_id));

CREATE POLICY "지점관리자 소속 수정" ON branch_members
  FOR UPDATE USING (is_branch_admin(branch_id));

CREATE POLICY "지점관리자 소속 삭제" ON branch_members
  FOR DELETE USING (is_branch_admin(branch_id));

-- ============================================
-- 11. 기존 RLS 정책 삭제 및 재생성
-- ============================================

-- ----- profiles -----
DROP POLICY IF EXISTS "관리자 프로필 수정" ON profiles;

CREATE POLICY "슈퍼관리자 프로필 수정" ON profiles
  FOR UPDATE USING (is_super_admin());

-- ----- children -----
DROP POLICY IF EXISTS "관리자 자녀 조회" ON children;

CREATE POLICY "지점관리자 자녀 조회" ON children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM branch_members bm
      WHERE bm.user_id = children.parent_id
      AND is_branch_admin(bm.branch_id)
    )
  );

-- ----- programs -----
DROP POLICY IF EXISTS "관리자 프로그램 관리" ON programs;

CREATE POLICY "지점관리자 프로그램 관리" ON programs
  FOR ALL USING (is_branch_admin(programs.branch_id));

-- ----- enrollments -----
DROP POLICY IF EXISTS "관리자 신청 조회" ON enrollments;
DROP POLICY IF EXISTS "관리자 신청 관리" ON enrollments;

CREATE POLICY "지점관리자 신청 조회" ON enrollments
  FOR SELECT USING (is_branch_admin(enrollments.branch_id));

CREATE POLICY "지점관리자 신청 관리" ON enrollments
  FOR ALL USING (is_branch_admin(enrollments.branch_id));

-- ----- facilities -----
DROP POLICY IF EXISTS "관리자 시설 관리" ON facilities;

CREATE POLICY "지점관리자 시설 관리" ON facilities
  FOR ALL USING (is_branch_admin(facilities.branch_id));

-- ----- rentals -----
DROP POLICY IF EXISTS "관리자 대관 관리" ON rentals;

CREATE POLICY "지점관리자 대관 관리" ON rentals
  FOR ALL USING (is_branch_admin(rentals.branch_id));

-- ----- attendance -----
DROP POLICY IF EXISTS "관리자 출석 관리" ON attendance;

CREATE POLICY "지점관리자 출석 관리" ON attendance
  FOR ALL USING (is_branch_admin(attendance.branch_id));

-- ----- fees -----
DROP POLICY IF EXISTS "관리자 회비 관리" ON fees;

CREATE POLICY "지점관리자 회비 관리" ON fees
  FOR ALL USING (is_branch_admin(fees.branch_id));

-- ----- toys -----
DROP POLICY IF EXISTS "관리자 장난감 관리" ON toys;

CREATE POLICY "지점관리자 장난감 관리" ON toys
  FOR ALL USING (is_branch_admin(toys.branch_id));

-- ----- toy_rentals -----
DROP POLICY IF EXISTS "관리자 대여 조회" ON toy_rentals;
DROP POLICY IF EXISTS "관리자 대여 관리" ON toy_rentals;

CREATE POLICY "지점관리자 대여 조회" ON toy_rentals
  FOR SELECT USING (is_branch_admin(toy_rentals.branch_id));

CREATE POLICY "지점관리자 대여 관리" ON toy_rentals
  FOR ALL USING (is_branch_admin(toy_rentals.branch_id));

COMMIT;
