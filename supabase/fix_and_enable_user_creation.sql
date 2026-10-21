-- ==============================================================================
-- Fix Auth Schema & Enable Bulletproof CRM User Creation
-- 1. Fixes NULL token columns on auth.users for all users
-- 2. Fully configures tarunsaikola2003@gmail.com (auth.users, auth.identities, profiles)
-- 3. Defines create_crm_user function for all future team member creations
-- ==============================================================================

-- ─── 1. Fix NULL token columns on auth.users ──────────────────────────────────
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

-- ─── 2. Setup/Fix tarunsaikola2003@gmail.com in auth.users & auth.identities ──
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'tarunsaikola2003@gmail.com';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    -- Use matching profile UUID if present, or generate fresh
    SELECT id INTO v_user_id FROM public.profiles WHERE email = v_email;
    IF v_user_id IS NULL THEN
      v_user_id := 'cb8d026e-0295-4f1e-b04b-92a5f5d6b9e9'::uuid;
    END IF;

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new,
      email_change_token_current,
      phone_change,
      phone_change_token,
      reauthentication_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt('720448@Sai', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"sam","phone":"8088766989","role":"inbound_sales"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = crypt('720448@Sai', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = '',
      phone_change = '',
      phone_change_token = '',
      reauthentication_token = '',
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"sam","phone":"8088766989","role":"inbound_sales"}'::jsonb,
      role = 'authenticated',
      aud = 'authenticated',
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Clean up any broken identities for this user
  DELETE FROM auth.identities WHERE user_id = v_user_id;

  -- Insert valid identity (id is UUID, provider_id is text)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false,
      'full_name', 'sam',
      'role', 'inbound_sales'
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- Ensure public.profiles has matching active record
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
    v_user_id,
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'sam',
    v_email,
    '8088766989',
    'inbound_sales',
    'active',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'inbound_sales',
    account_status = 'active',
    is_active = true,
    full_name = 'sam',
    phone = '8088766989',
    organization_id = '00000000-0000-0000-0000-000000000001',
    company_id = '00000000-0000-0000-0000-000000000001',
    updated_at = now();

  RAISE NOTICE 'User % (ID: %) successfully configured.', v_email, v_user_id;
END $$;

-- ─── 3. Function to create CRM users safely from the admin dashboard ─────────
DROP FUNCTION IF EXISTS public.create_crm_user(text, text, text, text, public.app_role, uuid, text[], text[], integer, integer);
DROP FUNCTION IF EXISTS public.create_crm_user(text, text, text, text, text, uuid, text[], text[], integer, integer);

CREATE OR REPLACE FUNCTION public.create_crm_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_role text DEFAULT 'inbound_sales',
  p_organization_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  p_service_pincodes text[] DEFAULT '{}',
  p_service_areas text[] DEFAULT '{}',
  p_max_active_leads integer DEFAULT 15,
  p_experience_years integer DEFAULT 2
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id uuid := gen_random_uuid();
  v_identity_id uuid := gen_random_uuid();
  v_clean_email text := lower(trim(p_email));
  v_profile record;
BEGIN
  -- 1. Check if user already exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_clean_email) THEN
    RAISE EXCEPTION 'User with email "%" already exists.', v_clean_email;
  END IF;

  -- 2. Insert into auth.users with all non-null tokens
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    is_super_admin
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_clean_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'phone', p_phone, 'role', p_role),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    false
  );

  -- 3. Insert into auth.identities (id is UUID, provider_id is text)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_identity_id,
    v_user_id,
    v_user_id::text,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_clean_email,
      'email_verified', true,
      'phone_verified', false,
      'full_name', p_full_name,
      'role', p_role
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- 4. Insert into public.profiles
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
    v_user_id,
    p_organization_id,
    p_organization_id,
    p_full_name,
    v_clean_email,
    p_phone,
    p_role::public.app_role,
    'active',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_id = excluded.organization_id,
    company_id = excluded.company_id,
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    account_status = 'active',
    is_active = true,
    updated_at = now()
  RETURNING * INTO v_profile;

  -- 5. If field agent, create field_agent_profiles record
  IF p_role = 'field_agent' THEN
    INSERT INTO public.field_agent_profiles (
      user_id,
      organization_id,
      company_id,
      service_pincodes,
      service_areas,
      max_active_leads,
      experience_years,
      availability,
      is_available
    ) VALUES (
      v_user_id,
      p_organization_id,
      p_organization_id,
      COALESCE(p_service_pincodes, '{}'),
      COALESCE(p_service_areas, '{"Pune Metro"}'),
      COALESCE(p_max_active_leads, 15),
      COALESCE(p_experience_years, 2),
      'available',
      true
    ) ON CONFLICT (user_id) DO UPDATE SET
      service_pincodes = excluded.service_pincodes,
      service_areas = excluded.service_areas;
  END IF;

  RETURN row_to_json(v_profile)::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_crm_user TO authenticated, anon;
