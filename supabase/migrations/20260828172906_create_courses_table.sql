/*
# Create courses table (single-tenant, no auth)

## Overview
Adds a `courses` table to store learning-management course records for the
CodeCraftHub dashboard. This is a single-tenant app with no sign-in screen,
so data is intentionally public/shared and accessible by the anon role that
the frontend (and the edge function using the anon key) operates as.

## New Tables
- `courses`
  - `id` (uuid, primary key, auto-generated)
  - `name` (text, not null) - course name
  - `description` (text, not null) - course description
  - `target_date` (date, not null) - target completion date (YYYY-MM-DD)
  - `status` (text, not null, default 'Not Started') - one of
    'Not Started', 'In Progress', 'Completed'
  - `created_at` (timestamptz, default now()) - creation timestamp (read-only)

## Security
- Enable RLS on `courses`.
- Allow anon + authenticated full CRUD because the data is intentionally
  public/shared (no-auth single-tenant app).

## Notes
1. No user_id column or auth.uid() checks — there is no sign-in screen.
2. `USING (true)` / `WITH CHECK (true)` is correct here because all rows are
   intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  target_date date NOT NULL,
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE
  TO anon, authenticated USING (true);
