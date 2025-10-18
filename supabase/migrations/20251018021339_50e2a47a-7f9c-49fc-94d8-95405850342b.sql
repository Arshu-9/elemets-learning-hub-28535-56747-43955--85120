-- Add foreign key constraints that are missing

-- Add foreign key from enrollments.student_id to profiles.user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_student_id_fkey'
  ) THEN
    ALTER TABLE public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from enrollments.course_id to courses.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_course_id_fkey'
  ) THEN
    ALTER TABLE public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from assignments.course_id to courses.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assignments_course_id_fkey'
  ) THEN
    ALTER TABLE public.assignments
    ADD CONSTRAINT assignments_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from submissions.student_id to profiles.user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'submissions_student_id_fkey'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from submissions.assignment_id to assignments.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'submissions_assignment_id_fkey'
  ) THEN
    ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey
    FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from grades.submission_id to submissions.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'grades_submission_id_fkey'
  ) THEN
    ALTER TABLE public.grades
    ADD CONSTRAINT grades_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;
  END IF;
END $$;