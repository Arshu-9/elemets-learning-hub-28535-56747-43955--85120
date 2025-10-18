-- Trigger types regeneration
-- Add a comment to ensure the types file is regenerated with all existing tables
COMMENT ON TABLE public.courses IS 'Courses offered by teachers';
COMMENT ON TABLE public.enrollments IS 'Student enrollments in courses';
COMMENT ON TABLE public.assignments IS 'Assignments for courses';
COMMENT ON TABLE public.submissions IS 'Student assignment submissions';
COMMENT ON TABLE public.grades IS 'Grades for submissions';
COMMENT ON TABLE public.user_roles IS 'User role assignments';
COMMENT ON TABLE public.profiles IS 'User profile information';