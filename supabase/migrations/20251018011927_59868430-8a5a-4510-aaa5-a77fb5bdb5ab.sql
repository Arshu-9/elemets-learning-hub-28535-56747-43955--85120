-- Update the handle_new_user function to also create user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.email
  );
  
  -- Insert user role from metadata (default to student if not provided)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'student')::app_role
  );
  
  RETURN new;
END;
$$;