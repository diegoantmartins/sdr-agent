-- Multi-tenant core hardening
ALTER TABLE "ActiveLead" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "ColdLead" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT 'default';

-- Replace global phone uniqueness with tenant scoped uniqueness
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ActiveLead_phone_key'
  ) THEN
    EXECUTE 'DROP INDEX "ActiveLead_phone_key"';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_phone_unique" ON "ActiveLead"("tenantId", "phone");
CREATE INDEX IF NOT EXISTS "ActiveLead_tenantId_idx" ON "ActiveLead"("tenantId");
CREATE INDEX IF NOT EXISTS "ColdLead_tenantId_idx" ON "ColdLead"("tenantId");
CREATE INDEX IF NOT EXISTS "Message_tenantId_idx" ON "Message"("tenantId");

CREATE TABLE IF NOT EXISTS "GovernanceAudit" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "actor" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "GovernanceAudit_tenantId_idx" ON "GovernanceAudit"("tenantId");
CREATE INDEX IF NOT EXISTS "GovernanceAudit_action_idx" ON "GovernanceAudit"("action");
CREATE INDEX IF NOT EXISTS "GovernanceAudit_createdAt_idx" ON "GovernanceAudit"("createdAt");
