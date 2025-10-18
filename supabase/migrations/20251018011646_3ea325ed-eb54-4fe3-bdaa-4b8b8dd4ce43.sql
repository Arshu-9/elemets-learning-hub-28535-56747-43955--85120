-- Trigger types regeneration by updating table comments
COMMENT ON TABLE public.courses IS 'Courses offered by teachers - Types refresh';
COMMENT ON TABLE public.enrollments IS 'Student enrollments in courses - Types refresh';
COMMENT ON TABLE public.assignments IS 'Assignments for courses - Types refresh';
COMMENT ON TABLE public.submissions IS 'Student assignment submissions - Types refresh';
COMMENT ON TABLE public.grades IS 'Grades for submissions - Types refresh';
COMMENT ON TABLE public.user_roles IS 'User role assignments - Types refresh';
COMMENT ON TABLE public.profiles IS 'User profile information - Types refresh';