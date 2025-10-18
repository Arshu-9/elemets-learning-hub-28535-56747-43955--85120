-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(course_id, student_id)
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(assignment_id, student_id)
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  grade INTEGER NOT NULL CHECK (grade >= 0 AND grade <= 100),
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);

-- RLS Policies for courses
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Teachers can create courses" ON public.courses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Teachers can update own courses" ON public.courses FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete own courses" ON public.courses FOR DELETE USING (auth.uid() = teacher_id);

-- RLS Policies for enrollments
CREATE POLICY "Anyone can view enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Students can enroll in courses" ON public.enrollments FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'student') AND auth.uid() = student_id);
CREATE POLICY "Students can delete own enrollments" ON public.enrollments FOR DELETE USING (auth.uid() = student_id);

-- RLS Policies for assignments
CREATE POLICY "Anyone can view assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Teachers can create assignments for their courses" ON public.assignments 
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'teacher') AND 
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid())
  );
CREATE POLICY "Teachers can update assignments for their courses" ON public.assignments 
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'teacher') AND 
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid())
  );
CREATE POLICY "Teachers can delete assignments for their courses" ON public.assignments 
  FOR DELETE USING (
    public.has_role(auth.uid(), 'teacher') AND 
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND teacher_id = auth.uid())
  );

-- RLS Policies for submissions
CREATE POLICY "Students can view own submissions" ON public.submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view submissions for their courses" ON public.submissions 
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher') AND 
    EXISTS (
      SELECT 1 FROM public.assignments a 
      JOIN public.courses c ON a.course_id = c.id 
      WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Students can create own submissions" ON public.submissions 
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'student') AND auth.uid() = student_id);
CREATE POLICY "Students can update own submissions" ON public.submissions 
  FOR UPDATE USING (auth.uid() = student_id);

-- RLS Policies for grades
CREATE POLICY "Students can view own grades" ON public.grades 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.submissions 
      WHERE id = submission_id AND student_id = auth.uid()
    )
  );
CREATE POLICY "Teachers can view grades for their courses" ON public.grades 
  FOR SELECT USING (
    public.has_role(auth.uid(), 'teacher') AND 
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON s.assignment_id = a.id
      JOIN public.courses c ON a.course_id = c.id
      WHERE s.id = submission_id AND c.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Teachers can create grades for their courses" ON public.grades 
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'teacher') AND 
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON s.assignment_id = a.id
      JOIN public.courses c ON a.course_id = c.id
      WHERE s.id = submission_id AND c.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Teachers can update grades for their courses" ON public.grades 
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'teacher') AND 
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON s.assignment_id = a.id
      JOIN public.courses c ON a.course_id = c.id
      WHERE s.id = submission_id AND c.teacher_id = auth.uid()
    )
  );

-- Create function and trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();