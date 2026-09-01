-- ============================================================================
-- EDUNOTES / MAKAUT CSE STUDENT PLATFORM — PRODUCTION DATABASE SCHEMA
-- PostgreSQL / Supabase Schema with Row Level Security (RLS) & Storage Policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    college TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
    semester TEXT NOT NULL DEFAULT 'Semester I',
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'CR', 'MODERATOR', 'ADMIN')),
    avatar_url TEXT,
    bio TEXT,
    karma_points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile automatically upon Supabase Auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, student_id, college, branch, semester, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'MAKAUT Student'),
    COALESCE(new.raw_user_meta_data->>'student_id', 'MAK-' || substring(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'college', 'MAKAUT Affiliated Institute'),
    COALESCE(new.raw_user_meta_data->>'branch', 'Computer Science & Engineering'),
    COALESCE(new.raw_user_meta_data->>'semester', 'Semester I'),
    'STUDENT' -- ALWAYS default to STUDENT (cannot self-select ADMIN/CR/MODERATOR)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------------------------
-- SECURE ROLE PROTECTION & PROMOTION FUNCTIONS (DATABASE-ENFORCED, NO RECURSION)
-- ----------------------------------------------------------------------------
-- Non-recursive Security Definer helper to check if a user is an ADMIN
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Helper to check if a user is a CLASS REPRESENTATIVE (CR)
CREATE OR REPLACE FUNCTION public.is_cr(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'CR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Helper to check if a user is MODERATOR or ADMIN
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('MODERATOR', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Helper to check if a user is CR or ADMIN
CREATE OR REPLACE FUNCTION public.is_cr_or_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('CR', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Trigger function: Prevents non-admins from changing the 'role' column on profiles
CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if the calling user is an existing ADMIN
    IF NOT public.is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Access Denied: Only an existing ADMIN can promote or demote user roles.';
    END IF;

    -- Protect primary admin sayangorai298@gmail.com from accidental demotion if only 1 admin remains
    IF OLD.email = 'sayangorai298@gmail.com' AND NEW.role != 'ADMIN' THEN
      IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'ADMIN') <= 1 THEN
        RAISE EXCEPTION 'Safety Violation: Cannot demote the primary administrator when no other active ADMIN exists.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role_update();

-- Secure RPC function for ADMIN user role management
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
DECLARE
  target_email TEXT;
  admin_count INT;
BEGIN
  -- Verify caller is an active ADMIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Caller does not possess ADMIN privileges.';
  END IF;

  -- Validate role
  IF new_role NOT IN ('STUDENT', 'CR', 'MODERATOR', 'ADMIN') THEN
    RAISE EXCEPTION 'Invalid role specified. Must be STUDENT, CR, MODERATOR, or ADMIN.';
  END IF;

  -- Check if target is primary admin
  SELECT email INTO target_email FROM public.profiles WHERE id = target_user_id;
  IF target_email = 'sayangorai298@gmail.com' AND new_role != 'ADMIN' THEN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'ADMIN';
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Safety Violation: Cannot demote the primary administrator when no other active ADMIN exists.';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- 2. COURSES / SUBJECTS TABLE (Official MAKAUT First Year)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY, -- e.g., 'BS-M101'
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    semester TEXT NOT NULL, -- 'Semester I' or 'Semester II'
    course_type TEXT NOT NULL, -- 'Theory', 'Practical', 'Sessional', 'Mandatory'
    credits NUMERIC(3,1) NOT NULL,
    lecture_hours INT NOT NULL DEFAULT 3,
    tutorial_hours INT NOT NULL DEFAULT 1,
    practical_hours INT NOT NULL DEFAULT 0,
    contact_hours INT NOT NULL,
    group_rotation TEXT NOT NULL DEFAULT 'Both',
    description TEXT,
    prerequisites TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. MODULES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_number INT NOT NULL,
    title TEXT NOT NULL,
    contact_hours INT NOT NULL DEFAULT 8,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. TOPICS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    bloom_level TEXT DEFAULT 'L3 Apply',
    co_mapped TEXT DEFAULT 'CO1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. COMMUNITY NOTES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    uploader_name TEXT NOT NULL,
    uploader_avatar TEXT,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL REFERENCES public.courses(id),
    subject_name TEXT NOT NULL,
    module_name TEXT NOT NULL,
    topic_name TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'Class Notes', 'Handwritten Notes', 'Lecture Notes', 'Short Notes',
        'Important Questions', 'PYQs', 'Assignments', 'Lab Materials',
        'Practical Notes', 'Exam Preparation', 'Reference Material', 'Other'
    )),
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    downloads_count INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    rating_sum INT NOT NULL DEFAULT 0,
    rating_count INT NOT NULL DEFAULT 0,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. NOTE RATINGS TABLE (1 rating per user per note)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.note_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(note_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 7. NOTE COMMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.note_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.note_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. BOOKMARKS TABLE (User-specific)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL DEFAULT 'NOTE' CHECK (item_type IN ('NOTE', 'SYLLABUS', 'QUESTION', 'PYQ')),
    item_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- ----------------------------------------------------------------------------
-- 9. STUDENT PROGRESS TABLE (User-specific topic completion)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id, topic_name)
);

-- ----------------------------------------------------------------------------
-- 10. ACADEMIC Q&A FORUM
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    title TEXT NOT NULL,
    course_id TEXT NOT NULL REFERENCES public.courses(id),
    module_name TEXT,
    details TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    upvotes INT DEFAULT 1,
    is_solved BOOLEAN DEFAULT FALSE,
    best_answer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    text TEXT NOT NULL,
    upvotes INT DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. COMMUNITY CHAT MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel TEXT NOT NULL DEFAULT 'general',
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    user_role TEXT NOT NULL DEFAULT 'STUDENT',
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. IMPORTANT ANNOUNCEMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('MAKAUT', 'College', 'Exams', 'Assignments', 'Practical', 'Events', 'Internship', 'Placement')),
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    badge_type TEXT DEFAULT 'OFFICIAL',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. CONTENT REPORTS (Moderation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('NOTE', 'COMMENT', 'CHAT_MESSAGE', 'QUESTION', 'ANSWER')),
    item_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED', 'RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. ACADEMIC CALENDAR EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('EXAM', 'INTERNAL', 'ASSIGNMENT', 'PRACTICAL', 'PRESENTATION', 'HOLIDAY', 'EVENT')),
    event_date DATE NOT NULL,
    course_code TEXT,
    description TEXT,
    is_official BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Courses / Modules / Topics: Public read
CREATE POLICY "Courses viewable by all authenticated" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modules viewable by all authenticated" ON public.modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Topics viewable by all authenticated" ON public.topics FOR SELECT TO authenticated USING (true);

-- Notes: All authenticated can read, authenticated can insert own notes, owner/admin can update/delete
CREATE POLICY "Notes viewable by all authenticated students" ON public.notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated students can upload notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Students can update only own notes" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = uploader_id);
CREATE POLICY "Students can delete own notes or admin can delete any" ON public.notes FOR DELETE TO authenticated 
USING (auth.uid() = uploader_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR')));

-- Ratings: All authenticated can read, users can insert/update own rating
CREATE POLICY "Ratings viewable by all authenticated" ON public.note_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can rate notes" ON public.note_ratings FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Comments: All authenticated can read, users can insert, delete own
CREATE POLICY "Comments viewable by all authenticated" ON public.note_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can post comments" ON public.note_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments or mod can delete" ON public.note_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR')));

-- Bookmarks: Strictly user private
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Progress: Strictly user private
CREATE POLICY "Users manage own progress" ON public.student_progress FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Q&A: Read all, post own
CREATE POLICY "Questions viewable by all" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can ask questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Answers viewable by all" ON public.answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can answer questions" ON public.answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Chat: Read all, post own, CR and Admin can delete/moderate
CREATE POLICY "Chat viewable by all" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can post chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages or CR/Admin can moderate" ON public.chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_cr_or_admin(auth.uid()));

-- Announcements & Calendar: Read all, Admin & CR manage
CREATE POLICY "Announcements viewable by all" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and CR can manage announcements" ON public.announcements FOR ALL TO authenticated 
USING (public.is_admin(auth.uid()) OR (public.is_cr(auth.uid()) AND creator_id = auth.uid()));

CREATE POLICY "Calendar viewable by all" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage calendar" ON public.calendar_events FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR', 'CR')));

-- Reports: Users can create, Admin/Moderator can manage
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Moderators can view and manage reports" ON public.reports FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR')));

-- ----------------------------------------------------------------------------
-- SUPABASE STORAGE BUCKETS CONFIGURATION
-- ----------------------------------------------------------------------------
-- Create storage buckets for community-notes and user-avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community-notes', 'community-notes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Authenticated users can upload to community-notes
CREATE POLICY "Authenticated users can upload study files" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-notes');

CREATE POLICY "Public read access for community-notes" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'community-notes');

CREATE POLICY "Users can update and delete their own files" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'community-notes' AND auth.uid() = owner);

-- ----------------------------------------------------------------------------
-- OFFICIAL SYLLABUS PDF VERSIONING & AUDIT SYSTEM (CR & ADMIN AUTHORIZED)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.syllabus_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version INT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    change_summary TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploader_name TEXT NOT NULL,
    uploader_role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL, -- 'UPLOAD_NEW_VERSION', 'RESTORE_VERSION'
    previous_version INT,
    new_version INT NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enablement
ALTER TABLE public.syllabus_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_audit_log ENABLE ROW LEVEL SECURITY;

-- 1. All authenticated students and users can view active/historical syllabus metadata
CREATE POLICY "Syllabus versions viewable by all" ON public.syllabus_versions
  FOR SELECT TO authenticated USING (true);

-- 2. ONLY Class Representative (CR) and ADMIN can insert new syllabus versions (STUDENTS & MODERATORS DENIED)
CREATE POLICY "CR and Admin can insert syllabus versions" ON public.syllabus_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_cr_or_admin(auth.uid()));

-- 3. ONLY ADMIN can update syllabus versions (e.g. activating/restoring previous versions)
CREATE POLICY "Admin can update syllabus versions" ON public.syllabus_versions
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. ONLY ADMIN can delete syllabus versions (CR cannot delete version history)
CREATE POLICY "Admin can delete syllabus versions" ON public.syllabus_versions
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Audit log policies: CR and Admin can view and record audits
CREATE POLICY "CR and Admin can view syllabus audit log" ON public.syllabus_audit_log
  FOR SELECT TO authenticated
  USING (public.is_cr_or_admin(auth.uid()));

CREATE POLICY "CR and Admin can insert syllabus audit log" ON public.syllabus_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_cr_or_admin(auth.uid()));

-- Secure Database RPC for atomic syllabus version publishing
CREATE OR REPLACE FUNCTION public.publish_syllabus_version(
  p_file_name TEXT,
  p_storage_path TEXT,
  p_file_url TEXT,
  p_file_size BIGINT,
  p_change_summary TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_name TEXT;
  v_next_version INT;
  v_prev_version INT;
  v_new_row public.syllabus_versions%ROWTYPE;
BEGIN
  -- 1. Strict Database Authorization Enforcement
  IF NOT public.is_cr_or_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Only a verified Class Representative (CR) or Administrator can publish a new syllabus PDF.';
  END IF;

  -- 2. Retrieve caller metadata
  SELECT role, full_name INTO v_caller_role, v_caller_name
  FROM public.profiles
  WHERE id = auth.uid();

  -- 3. Calculate next version and locate previous active version
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version FROM public.syllabus_versions;
  SELECT version INTO v_prev_version FROM public.syllabus_versions WHERE is_active = TRUE LIMIT 1;
  IF v_prev_version IS NULL THEN
    v_prev_version := 1;
  END IF;

  -- 4. Deactivate existing active versions
  UPDATE public.syllabus_versions SET is_active = FALSE WHERE is_active = TRUE;

  -- 5. Insert new active version
  INSERT INTO public.syllabus_versions (
    version, file_name, storage_path, file_url, file_size, change_summary, is_active, uploaded_by, uploader_name, uploader_role
  ) VALUES (
    v_next_version, p_file_name, p_storage_path, p_file_url, p_file_size, p_change_summary, TRUE, auth.uid(), v_caller_name, v_caller_role
  ) RETURNING * INTO v_new_row;

  -- 6. Insert audit trail
  INSERT INTO public.syllabus_audit_log (
    user_id, user_name, user_role, action, previous_version, new_version, change_summary
  ) VALUES (
    auth.uid(), v_caller_name, v_caller_role, 'UPLOAD_NEW_VERSION', v_prev_version, v_next_version, p_change_summary
  );

  RETURN to_jsonb(v_new_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Secure Database RPC for Admin to restore an archived syllabus version
CREATE OR REPLACE FUNCTION public.admin_restore_syllabus_version(p_version_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_caller_name TEXT;
  v_prev_version INT;
  v_target_version INT;
  v_target_row public.syllabus_versions%ROWTYPE;
BEGIN
  -- 1. Enforce Admin only
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Only an Administrator can restore previous syllabus versions.';
  END IF;

  SELECT full_name INTO v_caller_name FROM public.profiles WHERE id = auth.uid();
  SELECT version INTO v_prev_version FROM public.syllabus_versions WHERE is_active = TRUE LIMIT 1;

  -- Locate target version
  SELECT * INTO v_target_row FROM public.syllabus_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target syllabus version not found.';
  END IF;
  v_target_version := v_target_row.version;

  -- Deactivate current and activate target version
  UPDATE public.syllabus_versions SET is_active = FALSE WHERE is_active = TRUE;
  UPDATE public.syllabus_versions SET is_active = TRUE WHERE id = p_version_id RETURNING * INTO v_target_row;

  -- Record in audit log
  INSERT INTO public.syllabus_audit_log (
    user_id, user_name, user_role, action, previous_version, new_version, change_summary
  ) VALUES (
    auth.uid(), v_caller_name, 'ADMIN', 'RESTORE_VERSION', v_prev_version, v_target_version, 'Restored version ' || v_target_version
  );

  RETURN to_jsonb(v_target_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------------------
-- INITIAL ADMIN ROLE PROMOTION (SAFE & NON-DESTRUCTIVE)
-- Promotes existing registered account 'sayangorai298@gmail.com' to ADMIN
-- Preserves all existing profile data, student ID, karma points, and credentials
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    target_uuid UUID;
BEGIN
    -- 1. Locate existing Auth user UUID
    SELECT id INTO target_uuid
    FROM auth.users
    WHERE email = 'sayangorai298@gmail.com';

    IF target_uuid IS NOT NULL THEN
        -- 2. Update role to ADMIN in profiles table
        UPDATE public.profiles
        SET role = 'ADMIN', updated_at = NOW()
        WHERE id = target_uuid;
        
        RAISE NOTICE 'SUCCESS: Promoted existing user UUID % (sayangorai298@gmail.com) to ADMIN.', target_uuid;
    ELSE
        -- Fallback check directly on public.profiles
        UPDATE public.profiles
        SET role = 'ADMIN', updated_at = NOW()
        WHERE email = 'sayangorai298@gmail.com';
        
        RAISE NOTICE 'NOTICE: Updated profiles record directly for sayangorai298@gmail.com to ADMIN.';
    END IF;
END $$;

