-- Force types regeneration by updating table comments
COMMENT ON TABLE public.profiles IS 'User profile information - Force types update';
COMMENT ON TABLE public.user_roles IS 'User role assignments - Force types update';
COMMENT ON TABLE public.courses IS 'Courses offered by teachers - Force types update';
COMMENT ON TABLE public.enrollments IS 'Student enrollments in courses - Force types update';
COMMENT ON TABLE public.assignments IS 'Assignments for courses - Force types update';
COMMENT ON TABLE public.submissions IS 'Student assignment submissions - Force types update';
COMMENT ON TABLE public.grades IS 'Grades for submissions - Force types update';