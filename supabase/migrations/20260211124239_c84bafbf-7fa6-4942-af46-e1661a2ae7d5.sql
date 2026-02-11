
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Pharmacists can manage their follow-ups" ON public.follow_ups;

-- Create a permissive policy instead
CREATE POLICY "Pharmacists can manage their follow-ups"
ON public.follow_ups
FOR ALL
TO authenticated
USING (auth.uid() = pharmacist_id)
WITH CHECK (auth.uid() = pharmacist_id);
