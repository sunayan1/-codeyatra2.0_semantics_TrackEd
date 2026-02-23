-- ============================================================
-- Migration: Add faculty, default_passcode to users
--            Add faculty, semester to subjects
-- Run this in the Supabase SQL editor against your live DB
-- ============================================================

-- 1. Add faculty & default_passcode to users (if they don't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_passcode TEXT;

-- 2. Add faculty & semester to subjects (if they don't exist)
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester INTEGER;
