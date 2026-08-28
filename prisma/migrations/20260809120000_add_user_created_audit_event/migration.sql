-- Adds a dedicated event type for administrator-created user accounts.
ALTER TYPE "AuditEventType" ADD VALUE IF NOT EXISTS 'USER_CREATED';
