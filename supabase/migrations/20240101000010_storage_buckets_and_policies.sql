-- ==============================================================================
-- Migration: 20240101000010_storage_buckets_and_policies.sql
-- Configure private Supabase Storage buckets and access control policies
-- ==============================================================================

-- ─── 1. Create Storage Buckets ────────────────────────────────────────────────
-- Bucket for lead attachments (customer roof photos, electricity bills, drawings)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-attachments',
  'lead-attachments',
  false,
  26214400, -- 25MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mp4', 'audio/mpeg', 'audio/ogg']
) on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];

-- Bucket for generated quotation PDFs and signed proposals
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quotation-pdfs',
  'quotation-pdfs',
  false,
  10485760, -- 10MB limit
  array['application/pdf']
) on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf'];

-- Bucket for company branding assets (company logos, signature stamps)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  true, -- Public read for PDF rendering and email embeds
  5242880, -- 5MB limit
  array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
) on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

-- ─── 2. Row Level Security Policies for Storage Objects ───────────────────────

-- Lead Attachments: SELECT
create policy "lead_attachments_org_select"
  on storage.objects for select
  using (
    bucket_id = 'lead-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Lead Attachments: INSERT
create policy "lead_attachments_org_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'lead-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Lead Attachments: DELETE (Admin only or uploader)
create policy "lead_attachments_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'lead-attachments'
    and auth.role() = 'authenticated'
    and (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
      or owner = auth.uid()
    )
  );

-- Quotation PDFs: SELECT
create policy "quotation_pdfs_org_select"
  on storage.objects for select
  using (
    bucket_id = 'quotation-pdfs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Quotation PDFs: INSERT
create policy "quotation_pdfs_org_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'quotation-pdfs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select coalesce(organization_id, company_id)::text
      from public.profiles
      where id = auth.uid()
    )
  );

-- Company Assets: SELECT (Public)
create policy "company_assets_public_select"
  on storage.objects for select
  using (bucket_id = 'company-assets');

-- Company Assets: INSERT & UPDATE (Admin only)
create policy "company_assets_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'company-assets'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
