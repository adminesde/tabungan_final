DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;

CREATE POLICY "Authenticated users can view profiles."
ON public.profiles FOR SELECT
USING ( auth.role() = 'authenticated' );