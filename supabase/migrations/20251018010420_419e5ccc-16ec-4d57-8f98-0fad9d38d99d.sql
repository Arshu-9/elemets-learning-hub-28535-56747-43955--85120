-- Enable insert on user_roles table for authenticated users during signup
-- This allows users to set their role when they sign up

DROP POLICY IF EXISTS "Users can insert own role during signup" ON public.user_roles;

CREATE POLICY "Users can insert own role during signup" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);