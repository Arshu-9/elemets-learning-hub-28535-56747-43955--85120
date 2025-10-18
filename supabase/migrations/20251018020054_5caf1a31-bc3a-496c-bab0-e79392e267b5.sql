-- Trigger types regeneration
COMMENT ON TABLE public.profiles IS 'User profile information - Updated';
COMMENT ON TABLE public.user_roles IS 'User role assignments - Updated';
COMMENT ON TABLE public.courses IS 'Courses offered by teachers - Updated';
COMMENT ON TABLE public.enrollments IS 'Student enrollments in courses - Updated';
COMMENT ON TABLE public.assignments IS 'Assignments for courses - Updated';
COMMENT ON TABLE public.submissions IS 'Student assignment submissions - Updated';
COMMENT ON TABLE public.grades IS 'Grades for submissions - Updated';