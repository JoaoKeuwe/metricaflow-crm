-- Allow meeting creators to view their own meetings so INSERT ... SELECT returns succeed
CREATE POLICY "Criador pode ver suas reuniões"
ON public.meetings
FOR SELECT
TO authenticated
USING (created_by = auth.uid());