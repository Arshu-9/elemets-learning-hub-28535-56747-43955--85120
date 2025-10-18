-- Add foreign key from enrollments to profiles
ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey;

ALTER TABLE public.enrollments
ADD CONSTRAINT enrollments_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key from submissions to profiles  
ALTER TABLE public.submissions
DROP CONSTRAINT IF EXISTS submissions_student_id_fkey;

ALTER TABLE public.submissions
ADD CONSTRAINT submissions_student_id_fkey
FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;