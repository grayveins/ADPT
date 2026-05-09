-- ============================================================================
-- Fix signup trigger chain: search_path-safe + fully qualified references
--
-- Why: handle_new_user (auth.users AFTER INSERT) inserts into public.profiles,
-- which fires handle_coach_role. handle_coach_role used unqualified `coaches`
-- and `profiles`. SECURITY DEFINER doesn't reset search_path; when the trigger
-- chain runs from the GoTrue auth context, `public` isn't in search_path and
-- the unqualified table lookup fails. End-user symptom: "Database error
-- saving new user" 500 from Supabase auth on every signup with role=coach.
--
-- Fix: pin search_path to public + pg_temp via SET inside the function (the
-- safe, supported way for SECURITY DEFINER triggers) and fully qualify every
-- table reference. Same treatment for handle_new_user as defence-in-depth.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_coach_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role = 'coach' AND (OLD.role IS NULL OR OLD.role != 'coach') THEN
    INSERT INTO public.coaches (id, display_name, is_accepting_clients)
    VALUES (NEW.id, COALESCE(NEW.first_name, 'Coach'), true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
