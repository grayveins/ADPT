-- User Limitations Migration
-- Tracks user pain/injury limitations for workout modifications

--------------------------------------------------------------------------------
-- USER LIMITATIONS TABLE
-- Stores active limitations that affect workout exercise selection
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_limitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,                          -- Body region: lower_back, shoulders, knees, etc.
  status TEXT NOT NULL DEFAULT 'active',       -- active, monitoring, resolved
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workouts_modified INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'monitoring', 'resolved'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_limitations_user 
  ON public.user_limitations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_limitations_active 
  ON public.user_limitations(user_id, status) WHERE status IN ('active', 'monitoring');

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS set_user_limitations_updated_at ON public.user_limitations;
CREATE TRIGGER set_user_limitations_updated_at
  BEFORE UPDATE ON public.user_limitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

--------------------------------------------------------------------------------
-- LIMITATION FEEDBACK TABLE
-- Tracks post-workout feedback on how limitations felt
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.limitation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limitation_id UUID NOT NULL REFERENCES public.user_limitations(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  feedback TEXT NOT NULL,                      -- better, same, worse
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_feedback CHECK (feedback IN ('better', 'same', 'worse'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_limitation_feedback_limitation 
  ON public.limitation_feedback(limitation_id);
CREATE INDEX IF NOT EXISTS idx_limitation_feedback_session 
  ON public.limitation_feedback(workout_session_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY - USER LIMITATIONS
--------------------------------------------------------------------------------
ALTER TABLE public.user_limitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limitations" 
  ON public.user_limitations FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own limitations" 
  ON public.user_limitations FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own limitations" 
  ON public.user_limitations FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own limitations" 
  ON public.user_limitations FOR DELETE 
  USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY - LIMITATION FEEDBACK
--------------------------------------------------------------------------------
ALTER TABLE public.limitation_feedback ENABLE ROW LEVEL SECURITY;

-- Users can access feedback for their own limitations
CREATE POLICY "Users can view own limitation feedback" 
  ON public.limitation_feedback FOR SELECT 
  USING (
    limitation_id IN (
      SELECT id FROM public.user_limitations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own limitation feedback" 
  ON public.limitation_feedback FOR INSERT 
  WITH CHECK (
    limitation_id IN (
      SELECT id FROM public.user_limitations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own limitation feedback" 
  ON public.limitation_feedback FOR DELETE 
  USING (
    limitation_id IN (
      SELECT id FROM public.user_limitations WHERE user_id = auth.uid()
    )
  );
