-- Migration script for Phone-based Auth
-- Run this validation to update existing database

-- Drop the email unique constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Make email nullable
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint to phone
-- NOTE: You might need to clean up duplicate phones first if any exist
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- Make phone not null
-- NOTE: Existing users with null phone will cause this to fail. 
-- Update them first: UPDATE users SET phone = '0000000000' WHERE phone IS NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
