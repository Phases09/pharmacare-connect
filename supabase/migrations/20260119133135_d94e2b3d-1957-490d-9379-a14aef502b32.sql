-- Add INSERT policy for reminders table so pharmacists can create reminders for their patients
CREATE POLICY "Pharmacists can insert reminders for their patients"
ON public.reminders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_id
    AND patients.pharmacist_id = auth.uid()
  )
);

-- Add UPDATE and DELETE policies for reminders
CREATE POLICY "Pharmacists can update reminders for their patients"
ON public.reminders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = reminders.patient_id
    AND patients.pharmacist_id = auth.uid()
  )
);

CREATE POLICY "Pharmacists can delete reminders for their patients"
ON public.reminders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = reminders.patient_id
    AND patients.pharmacist_id = auth.uid()
  )
);