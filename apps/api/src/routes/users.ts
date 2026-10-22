import { Router } from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import {
  createFieldAgentSchema,
  createInboundSalesSchema,
  updateCompanySettingsSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userFilterSchema,
} from '@solar-crm/shared';

import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/validate.js';

export const usersRouter = Router();
usersRouter.use(requireAuth);

const userCreationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many account creation requests. Please try again later.',
    },
  },
});

// ─── 1. GET /users — list, search & filter users in organization ─────────────
usersRouter.get('/', validate(userFilterSchema, 'query'), async (req: Request, res: Response, next) => {
  try {
    const { page, pageSize, role, account_status, search } = req.query as Record<string, string>;
    const orgId = req.auth!.organizationId;

    const pageNum = parseInt(page ?? '1', 10);
    const size = parseInt(pageSize ?? '25', 10);

    let query = supabaseAdmin
      .from('profiles')
      .select('*, field_agent_profiles(*)', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }
    if (account_status) {
      query = query.eq('account_status', account_status);
    }
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }

    query = query.range((pageNum - 1) * size, pageNum * size - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: {
        items: data ?? [],
        total: count ?? 0,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil((count ?? 0) / size),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 2. GET /users/me — current user profile ─────────────────────────────────
usersRouter.get('/me', async (req: Request, res: Response, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*, field_agent_profiles(*)')
      .eq('id', req.auth!.userId)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Profile not found');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── 3. POST /users/inbound-sales — Admin creates Inbound Sales account ───────
usersRouter.post(
  '/inbound-sales',
  requireRole('admin'),
  userCreationRateLimiter,
  validate(createInboundSalesSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { full_name, email, phone, password, send_invite } = req.body;
      const orgId = req.auth!.organizationId;
      const actorId = req.auth!.userId;

      // Temporary password if not provided
      const accountPassword = password ?? `Solar@${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;

      // Official Supabase Auth Admin user creation
      const isRealServiceKey =
        process.env.NODE_ENV === 'test' ||
        (process.env.SUPABASE_SERVICE_ROLE_KEY &&
          !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('super-secret-') &&
          process.env.SUPABASE_SERVICE_ROLE_KEY.length > 25);

      if (!isRealServiceKey) {
        throw new AppError(
          500,
          'SERVICE_ROLE_KEY_REQUIRED',
          'SUPABASE_SERVICE_ROLE_KEY is not configured in apps/api/.env. Please paste your Supabase service_role secret key into apps/api/.env to create users from the dashboard.',
        );
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: accountPassword,
        email_confirm: true,
        user_metadata: { full_name, phone, role: 'inbound_sales' },
      });

      if (authError || !authData.user) {
        throw new AppError(400, 'USER_CREATION_FAILED', authError?.message ?? 'Failed to create auth user');
      }

      // Ensure profile is present and updated
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          organization_id: orgId,
          company_id: orgId,
          full_name,
          email,
          phone,
          role: 'inbound_sales',
          account_status: 'active',
          is_active: true,
        })
        .select()
        .single();

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // 3. Generate setup or recovery link if requested
      let inviteLink: string | null = null;
      if (send_invite) {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
        });
        inviteLink = linkData?.properties?.action_link ?? null;
      }

      // 4. Record audit event
      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: actorId,
        p_action: 'create',
        p_entity_type: 'user_profile',
        p_entity_id: profile.id,
        p_new_values: { role: 'inbound_sales', full_name, email, phone },
      });

      res.status(201).json({
        success: true,
        data: {
          user: profile,
          inviteLink,
          temporaryPassword: !send_invite && !password ? accountPassword : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 4. POST /users/field-agent — Admin creates Field Agent account ──────────
usersRouter.post(
  '/field-agent',
  requireRole('admin'),
  userCreationRateLimiter,
  validate(createFieldAgentSchema),
  async (req: Request, res: Response, next) => {
    try {
      const {
        full_name,
        email,
        phone,
        address,
        pincode,
        service_areas,
        service_pincodes,
        max_active_leads,
        availability,
        experience_years,
        notes,
        password,
        send_invite,
      } = req.body;

      const orgId = req.auth!.organizationId;
      const actorId = req.auth!.userId;

      const accountPassword = password ?? `Solar@${Date.now()}!${Math.random().toString(36).slice(2, 8)}`;

      // Official Supabase Auth Admin user creation
      const isRealServiceKey =
        process.env.NODE_ENV === 'test' ||
        (process.env.SUPABASE_SERVICE_ROLE_KEY &&
          !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('super-secret-') &&
          process.env.SUPABASE_SERVICE_ROLE_KEY.length > 25);

      if (!isRealServiceKey) {
        throw new AppError(
          500,
          'SERVICE_ROLE_KEY_REQUIRED',
          'SUPABASE_SERVICE_ROLE_KEY is not configured in apps/api/.env. Please paste your Supabase service_role secret key into apps/api/.env to create users from the dashboard.',
        );
      }
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: accountPassword,
        email_confirm: true,
        user_metadata: { full_name, phone, role: 'field_agent' },
      });

      if (authError || !authData.user) {
        throw new AppError(400, 'USER_CREATION_FAILED', authError?.message ?? 'Failed to create auth user');
      }

      // Insert into profiles with authoritative role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          organization_id: orgId,
          company_id: orgId,
          full_name,
          email,
          phone,
          role: 'field_agent',
          account_status: 'active',
          is_active: true,
        })
        .select()
        .single();

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }

      // Insert into field_agent_profiles
      const { data: faProfile } = await supabaseAdmin
        .from('field_agent_profiles')
        .upsert({
          user_id: authData.user.id,
          organization_id: orgId,
          address,
          pincode,
          service_areas: service_areas ?? [],
          service_pincodes: service_pincodes ?? [],
          max_active_leads: max_active_leads ?? 15,
          availability: availability ?? 'available',
          experience_years: experience_years ?? 0,
          notes: notes ?? null,
        })
        .select()
        .single();

      // 4. Generate setup or recovery link if requested
      let inviteLink: string | null = null;
      if (send_invite) {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
        });
        inviteLink = linkData?.properties?.action_link ?? null;
      }

      // 5. Record audit event
      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: actorId,
        p_action: 'create',
        p_entity_type: 'field_agent_profile',
        p_entity_id: profile.id,
        p_new_values: {
          role: 'field_agent',
          full_name,
          email,
          service_areas,
          max_active_leads,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            ...profile,
            field_agent_profile: faProfile ?? (profile as any).field_agent_profile ?? null,
          },
          inviteLink,
          temporaryPassword: !send_invite && !password ? accountPassword : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 5. PATCH /users/:id — Edit profile & service areas ──────────────────────
usersRouter.patch('/:id', validate(updateUserSchema), async (req: Request, res: Response, next) => {
  try {
    const targetUserId = req.params['id'] as string;
    const isSelf = targetUserId === req.auth!.userId;
    const isAdmin = req.auth!.role === 'admin';
    const orgId = req.auth!.organizationId;

    if (!isSelf && !isAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot modify another user profile');
    }

    // Fetch existing profile
    const { data: oldProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*, field_agent_profiles(*)')
      .eq('id', targetUserId)
      .eq('organization_id', orgId)
      .single();

    if (fetchError || !oldProfile) {
      throw new AppError(404, 'NOT_FOUND', 'User profile not found');
    }

    const {
      full_name,
      phone,
      avatar_url,
      address,
      pincode,
      service_areas,
      service_pincodes,
      max_active_leads,
      availability,
      password,
    } = req.body;

    // If password provided, update credentials directly in Supabase Auth
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: password.trim(),
      });
      if (pwdError) {
        throw new AppError(400, 'PASSWORD_UPDATE_FAILED', pwdError.message);
      }
    }

    // Update main profile
    const profileUpdates: Record<string, unknown> = {};
    if (full_name !== undefined) profileUpdates['full_name'] = full_name;
    if (phone !== undefined) profileUpdates['phone'] = phone;
    if (avatar_url !== undefined) profileUpdates['avatar_url'] = avatar_url;

    let updatedProfile = oldProfile;
    if (Object.keys(profileUpdates).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetUserId)
        .eq('organization_id', orgId)
        .select()
        .single();
      if (error) throw error;
      updatedProfile = data;
    }

    // Update field agent profile if role is field agent and fields provided
    let updatedAgentProfile = oldProfile.field_agent_profiles;
    if (oldProfile.role === 'field_agent' && isAdmin) {
      const agentUpdates: Record<string, unknown> = {};
      if (address !== undefined) agentUpdates['address'] = address;
      if (pincode !== undefined) agentUpdates['pincode'] = pincode;
      if (service_areas !== undefined) agentUpdates['service_areas'] = service_areas;
      if (service_pincodes !== undefined) agentUpdates['service_pincodes'] = service_pincodes;
      if (max_active_leads !== undefined) agentUpdates['max_active_leads'] = max_active_leads;
      if (availability !== undefined) agentUpdates['availability'] = availability;

      if (Object.keys(agentUpdates).length > 0) {
        const { data, error } = await supabaseAdmin
          .from('field_agent_profiles')
          .update(agentUpdates)
          .eq('user_id', targetUserId)
          .eq('organization_id', orgId)
          .select()
          .single();
        if (error) throw error;
        updatedAgentProfile = data;
      }
    }

    // Audit log
    await supabaseAdmin.rpc('log_audit_event', {
      p_organization_id: orgId,
      p_actor_id: req.auth!.userId,
      p_action: 'update',
      p_entity_type: 'user_profile',
      p_entity_id: targetUserId,
      p_old_values: { full_name: oldProfile.full_name, phone: oldProfile.phone },
      p_new_values: profileUpdates,
    });

    res.json({
      success: true,
      data: {
        ...updatedProfile,
        field_agent_profile: updatedAgentProfile,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── 6. POST /users/:id/status — Activate or deactivate user account ─────────
usersRouter.post(
  '/:id/status',
  requireRole('admin'),
  validate(updateUserStatusSchema),
  async (req: Request, res: Response, next) => {
    try {
      const targetUserId = req.params['id'] as string;
      const orgId = req.auth!.organizationId;
      const { account_status } = req.body;

      if (targetUserId === req.auth!.userId) {
        throw new AppError(400, 'CANNOT_DEACTIVATE_SELF', 'Administrators cannot deactivate their own account');
      }

      // Update account status in profiles
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          account_status,
          is_active: account_status === 'active',
        })
        .eq('id', targetUserId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error || !data) {
        throw new AppError(404, 'NOT_FOUND', 'User profile not found in your organization');
      }

      // If suspended or inactive, ban in auth.users so existing session tokens are rejected immediately
      const isBanned = account_status !== 'active';
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: isBanned ? '876000h' : 'none',
      });

      // Record audit event
      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: req.auth!.userId,
        p_action: 'status_change',
        p_entity_type: 'user_profile',
        p_entity_id: targetUserId,
        p_new_values: { account_status },
      });

      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 7. POST /users/:id/reset-password — Send secure recovery link ───────────
usersRouter.post(
  '/:id/reset-password',
  requireRole('admin'),
  async (req: Request, res: Response, next) => {
    try {
      const targetUserId = req.params['id'] as string;
      const orgId = req.auth!.organizationId;

      const { data: userProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', targetUserId)
        .eq('organization_id', orgId)
        .single();

      if (fetchError || !userProfile) {
        throw new AppError(404, 'NOT_FOUND', 'User not found in your organization');
      }

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: userProfile.email,
      });

      if (linkError) {
        throw new AppError(500, 'LINK_GENERATION_FAILED', linkError.message);
      }

      // Log audit
      await supabaseAdmin.rpc('log_audit_event', {
        p_organization_id: orgId,
        p_actor_id: req.auth!.userId,
        p_action: 'update',
        p_entity_type: 'user_password_reset',
        p_entity_id: targetUserId,
      });

      res.json({
        success: true,
        data: {
          message: `Password reset link generated for ${userProfile.full_name}`,
          recoveryLink: linkData.properties?.action_link,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 8. Company Settings Router (Re-exported from settings.ts) ─────────────
export { settingsRouter } from './settings.js';
