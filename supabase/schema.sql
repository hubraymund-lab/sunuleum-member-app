-- Created: 2026-03-18
-- 수눌음 회원 관리 시스템 - Supabase 스키마
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. 프로필 테이블
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn')),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 자녀 테이블
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_year INT NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 프로그램 테이블
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '정기',
  start_date DATE,
  end_date DATE,
  capacity INT DEFAULT 0,
  fee INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 프로그램 신청 테이블
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'cancelled', 'completed')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, member_id, child_id)
);

-- 5. 시설 테이블
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  capacity INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 대관 신청 테이블
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_email TEXT DEFAULT '',
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(facility_id, date, start_time)
);

-- 7. 출석 테이블
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT '정기모임',
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 회비 테이블
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount INT NOT NULL DEFAULT 10000,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, month)
);

-- ============================================
-- 트리거: 회원가입 시 프로필 자동 생성
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 프로필 조회" ON profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필 수정" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "관리자 프로필 수정" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 자녀 조회" ON children FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "관리자 자녀 조회" ON children FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "본인 자녀 추가" ON children FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "본인 자녀 수정" ON children FOR UPDATE USING (parent_id = auth.uid());
CREATE POLICY "본인 자녀 삭제" ON children FOR DELETE USING (parent_id = auth.uid());

-- programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 프로그램 조회" ON programs FOR SELECT USING (true);
CREATE POLICY "관리자 프로그램 관리" ON programs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 신청 조회" ON enrollments FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "관리자 신청 조회" ON enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "본인 신청 추가" ON enrollments FOR INSERT WITH CHECK (member_id = auth.uid());
CREATE POLICY "본인 신청 취소" ON enrollments FOR UPDATE USING (member_id = auth.uid());
CREATE POLICY "관리자 신청 관리" ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- facilities
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 시설 조회" ON facilities FOR SELECT USING (true);
CREATE POLICY "관리자 시설 관리" ON facilities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- rentals
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 대관 조회" ON rentals FOR SELECT USING (true);
CREATE POLICY "누구나 대관 신청" ON rentals FOR INSERT WITH CHECK (true);
CREATE POLICY "관리자 대관 관리" ON rentals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 출석 조회" ON attendance FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "관리자 출석 관리" ON attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- fees
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 회비 조회" ON fees FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "관리자 회비 관리" ON fees FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 9. 장난감 테이블
-- ============================================
CREATE TABLE toys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '일반',
  image_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. 장난감 대여 테이블
CREATE TABLE toy_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toy_id UUID NOT NULL REFERENCES toys(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  rented_at TIMESTAMPTZ DEFAULT now(),
  due_date DATE NOT NULL,
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'rented' CHECK (status IN ('rented', 'returned', 'overdue')),
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: toys
ALTER TABLE toys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "누구나 장난감 조회" ON toys FOR SELECT USING (true);
CREATE POLICY "관리자 장난감 관리" ON toys FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: toy_rentals
ALTER TABLE toy_rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 대여 조회" ON toy_rentals FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "관리자 대여 조회" ON toy_rentals FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "본인 대여 신청" ON toy_rentals FOR INSERT WITH CHECK (member_id = auth.uid());
CREATE POLICY "관리자 대여 관리" ON toy_rentals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
