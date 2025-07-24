CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT
USING (true);