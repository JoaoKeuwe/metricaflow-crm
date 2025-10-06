-- Create enum for meeting status
CREATE TYPE public.meeting_status AS ENUM ('agendada', 'realizada', 'cancelada');

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.meeting_status NOT NULL DEFAULT 'agendada',
  feedback TEXT,
  feedback_collected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create meeting_participants table
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_organizer BOOLEAN NOT NULL DEFAULT false,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Owners and gestores can view all company meetings"
ON public.meetings FOR SELECT
USING (
  company_id = get_user_company_id() 
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

CREATE POLICY "Vendedores can view meetings they participate in"
ON public.meetings FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = meetings.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Owners and gestores can create meetings"
ON public.meetings FOR INSERT
WITH CHECK (
  company_id = get_user_company_id()
  AND created_by = auth.uid()
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

CREATE POLICY "Owners and gestores can update company meetings"
ON public.meetings FOR UPDATE
USING (
  company_id = get_user_company_id()
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

CREATE POLICY "Vendedores can update their meeting feedback"
ON public.meetings FOR UPDATE
USING (
  has_role(auth.uid(), 'vendedor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.meeting_participants
    WHERE meeting_id = meetings.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Owners and gestores can delete meetings"
ON public.meetings FOR DELETE
USING (
  company_id = get_user_company_id()
  AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
);

-- RLS Policies for meeting_participants
CREATE POLICY "Users can view participants of meetings they can access"
ON public.meeting_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_participants.meeting_id
    AND (
      (m.company_id = get_user_company_id() AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role)))
      OR (user_id = auth.uid())
    )
  )
);

CREATE POLICY "Owners and gestores can manage participants"
ON public.meeting_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_participants.meeting_id
    AND m.company_id = get_user_company_id()
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_participants.meeting_id
    AND m.company_id = get_user_company_id()
    AND (is_owner(auth.uid()) OR has_role(auth.uid(), 'gestor'::app_role))
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_meetings_company_id ON public.meetings(company_id);
CREATE INDEX idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_lead_id ON public.meetings(lead_id);
CREATE INDEX idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user_id ON public.meeting_participants(user_id);