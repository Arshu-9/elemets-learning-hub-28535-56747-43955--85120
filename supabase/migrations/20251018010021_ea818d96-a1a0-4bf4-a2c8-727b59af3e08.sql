-- Force types regeneration by updating the updated_at trigger on courses
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();