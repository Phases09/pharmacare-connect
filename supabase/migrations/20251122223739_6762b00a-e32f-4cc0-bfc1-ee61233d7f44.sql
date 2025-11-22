-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for pharmacist users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  pharmacy_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER,
  consent_given BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacists can manage their patients"
  ON public.patients FOR ALL
  USING (auth.uid() = pharmacist_id);

-- Create medications table (drug database)
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  treatment_duration_days INTEGER NOT NULL,
  dosage_frequency_hours INTEGER,
  reminder_frequency TEXT NOT NULL, -- 'per-dose', 'daily', 'twice-daily', etc.
  follow_up_day INTEGER NOT NULL,
  is_chronic BOOLEAN DEFAULT false,
  refill_reminder_days INTEGER,
  standard_dosage TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medications"
  ON public.medications FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage medications"
  ON public.medications FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Insert default medications
INSERT INTO public.medications (name, category, treatment_duration_days, dosage_frequency_hours, reminder_frequency, follow_up_day, is_chronic, refill_reminder_days, standard_dosage) VALUES
('Artesunate-Lumefantrine', 'Antimalarial', 3, 12, 'twice-daily', 3, false, NULL, '4 tablets twice daily'),
('Amoxicillin', 'Antibiotic', 7, 8, 'per-dose', 5, false, NULL, '500mg 3x daily'),
('Amlodipine', 'Antihypertensive', 30, 24, 'daily', 30, true, 25, '5mg once daily'),
('Metformin', 'Antidiabetic', 30, 24, 'daily', 30, true, 25, '500mg twice daily'),
('Paracetamol', 'Analgesic', 3, 6, 'as-needed', 3, false, NULL, '500mg as needed');

-- Create patient_medications table (junction with prescription details)
CREATE TABLE public.patient_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  prescribed_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quantity TEXT NOT NULL,
  custom_dosage TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacists can manage patient medications"
  ON public.patient_medications FOR ALL
  USING (auth.uid() = prescribed_by);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_medication_id UUID REFERENCES public.patient_medications(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('dose', 'adherence', 'completion', 'refill')),
  message TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('sms', 'whatsapp', 'push', 'all')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacists can view reminders for their patients"
  ON public.reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = reminders.patient_id
      AND patients.pharmacist_id = auth.uid()
    )
  );

-- Create follow_ups table
CREATE TABLE public.follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_medication_id UUID REFERENCES public.patient_medications(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  pharmacist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  outcome TEXT CHECK (outcome IN ('improving', 'needs_refill', 'not_reached', 'needs_consultation', 'other')),
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacists can manage their follow-ups"
  ON public.follow_ups FOR ALL
  USING (auth.uid() = pharmacist_id);

-- Create indexes for performance
CREATE INDEX idx_patients_pharmacist ON public.patients(pharmacist_id);
CREATE INDEX idx_patient_medications_patient ON public.patient_medications(patient_id);
CREATE INDEX idx_patient_medications_medication ON public.patient_medications(medication_id);
CREATE INDEX idx_reminders_patient ON public.reminders(patient_id);
CREATE INDEX idx_reminders_scheduled ON public.reminders(scheduled_at, status);
CREATE INDEX idx_follow_ups_pharmacist ON public.follow_ups(pharmacist_id);
CREATE INDEX idx_follow_ups_scheduled ON public.follow_ups(scheduled_date, status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_patients
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_medications
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_patient_medications
  BEFORE UPDATE ON public.patient_medications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_follow_ups
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();