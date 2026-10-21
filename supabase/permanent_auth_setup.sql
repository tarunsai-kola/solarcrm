-- ==============================================================================
-- PERMANENT AUTH & PROFILE SYNC SETUP (Official Supabase Architecture)
-- 
-- 1. Cleans up broken test records from raw SQL experiments
-- 2. Creates the standard Supabase user-to-profile trigger
--    (Whenever a user is created via Supabase Dashboard or Admin API,
--     their CRM profile is automatically created and activated).
-- ==============================================================================

-- ─── 1. Clean up broken user records ──────────────────────────────────────────
-- Deleting from auth.users cascades automatically to public.profiles
DELETE FROM auth.users WHERE email = 'tarunsaikola2003@gmail.com';
DELETE FROM auth.users WHERE email = 'dummy_test_123@test.com';
DELETE FROM public.profiles WHERE email = 'tarunsaikola2003@gmail.com';
DELETE FROM public.profiles WHERE email = 'dummy_test_123@test.com';

-- ─── 2. Standard Profile Auto-Sync Trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_meta_role text;
BEGIN
  v_meta_role := NEW.raw_user_meta_data->>'role';

  -- Determine authoritative role
  IF v_meta_role IS NOT NULL AND v_meta_role IN ('admin', 'inbound_sales', 'field_agent') THEN
    v_role := v_meta_role::public.app_role;
  ELSIF NEW.email = 'tarunsaikolaa@gmail.com' THEN
    v_role := 'admin'::public.app_role;
  ELSE
    v_role := 'inbound_sales'::public.app_role;
  END IF;

  -- Insert profile linking directly to auth.users.id
  INSERT INTO public.profiles (
    id,
    organization_id,
    company_id,
    full_name,
    email,
    phone,
    role,
    account_status,
    is_active
  ) VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    v_role,
    'active',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    account_status = 'active',
    is_active = true,
    updated_at = now();

  -- If field agent, create default field_agent_profiles record
  IF v_role = 'field_agent' THEN
    INSERT INTO public.field_agent_profiles (
      user_id,
      organization_id,
      service_pincodes,
      service_areas,
      max_active_leads,
      experience_years,
      availability
    ) VALUES (
      NEW.id,
      '00000000-0000-0000-0000-000000000001',
      '{}',
      '{"Pune Metro"}',
      15,
      2,
      'available'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
