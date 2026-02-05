-- Saved Programs Migration
-- Allows users to save AI-generated workout programs as templates

--------------------------------------------------------------------------------
-- SAVED PROGRAMS TABLE
-- Stores user's saved workout programs/templates
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,                               -- build_muscle, lose_fat, etc.
  experience TEXT,                         -- beginner, intermediate, advanced
  workouts_per_week INTEGER NOT NULL DEFAULT 3,
  program_data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Full program structure
  is_ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,        -- Currently active program
  times_used INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_programs_user 
  ON public.saved_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_programs_active 
  ON public.saved_programs(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_programs_recent 
  ON public.saved_programs(user_id, updated_at DESC);

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS set_saved_programs_updated_at ON public.saved_programs;
CREATE TRIGGER set_saved_programs_updated_at
  BEFORE UPDATE ON public.saved_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------------------------------------
ALTER TABLE public.saved_programs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saved programs
CREATE POLICY "Users can view own saved programs" 
  ON public.saved_programs FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved programs" 
  ON public.saved_programs FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved programs" 
  ON public.saved_programs FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved programs" 
  ON public.saved_programs FOR DELETE 
  USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- HELPER FUNCTION: Set program as active (deactivates others)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_active_program(p_program_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Deactivate all user's programs
  UPDATE public.saved_programs
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  -- Activate the selected program
  UPDATE public.saved_programs
  SET 
    is_active = TRUE, 
    times_used = times_used + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_program_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.set_active_program(UUID) TO authenticated;
