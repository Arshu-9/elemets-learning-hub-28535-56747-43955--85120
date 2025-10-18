-- Add foreign key constraint from courses.teacher_id to profiles.user_id
-- This enables proper joining between courses and teacher profiles

ALTER TABLE public.courses
DROP CONSTRAINT IF EXISTS courses_teacher_id_fkey;

ALTER TABLE public.courses
ADD CONSTRAINT courses_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;