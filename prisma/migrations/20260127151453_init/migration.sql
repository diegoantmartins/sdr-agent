-- CreateEnum
CREATE TYPE "IntentType" AS ENUM ('BUY_NOW', 'TRIAGE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('TRIAGE', 'HOT', 'FOLLOW_UP', 'COLD', 'ARCHIVED', 'OPEN');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('incoming', 'outgoing');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'RETRY');

-- CreateEnum
CREATE TYPE "LabelCategory" AS ENUM ('urgency', 'status', 'attention', 'archive', 'business');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('private', 'sales_note', 'system', 'summary');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "ActiveLead" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "intentClassified" "IntentType",
    "firstMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 1,
    "status" "LeadStatus" NOT NULL DEFAULT 'TRIAGE',
    "conversionStage" TEXT,
    "chatwootContactId" TEXT,
    "chatwootConvId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'whatsapp',
    "campaignId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActiveLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColdLead" (
    "id" TEXT NOT NULL,
    "originalLeadId" TEXT,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "lastScore" INTEGER NOT NULL,
    "lastStatus" TEXT NOT NULL,
    "conversationData" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "freezeReason" TEXT NOT NULL,
    "reactivationCount" INTEGER NOT NULL DEFAULT 0,
    "lastReactivatedAt" TIMESTAMP(3),
    "chatwootConvId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColdLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "scoreChange" INTEGER NOT NULL DEFAULT 0,
    "intentDetected" TEXT,
    "chatwootMessageId" TEXT,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemLabel" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "chatwootLabelId" TEXT,
    "category" "LabelCategory" NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "chatwootNoteId" TEXT,
    "postedToChat" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "leadsProcessed" INTEGER NOT NULL DEFAULT 0,
    "leadsSkipped" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMetric" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "firstResponseTime" INTEGER,
    "avgResponseTime" INTEGER,
    "totalDuration" INTEGER,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "userMessageCount" INTEGER NOT NULL DEFAULT 0,
    "aiMessageCount" INTEGER NOT NULL DEFAULT 0,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "conversionTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHealth" (
    "id" TEXT NOT NULL,
    "chatwootStatus" TEXT NOT NULL DEFAULT 'unknown',
    "openaiStatus" TEXT NOT NULL DEFAULT 'unknown',
    "uazapiStatus" TEXT NOT NULL DEFAULT 'unknown',
    "dbConnections" INTEGER NOT NULL DEFAULT 0,
    "dbLatency" INTEGER NOT NULL DEFAULT 0,
    "queueLength" INTEGER NOT NULL DEFAULT 0,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActiveLeadToSystemLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveLead_phone_key" ON "ActiveLead"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveLead_chatwootContactId_key" ON "ActiveLead"("chatwootContactId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveLead_chatwootConvId_key" ON "ActiveLead"("chatwootConvId");

-- CreateIndex
CREATE INDEX "ActiveLead_phone_idx" ON "ActiveLead"("phone");

-- CreateIndex
CREATE INDEX "ActiveLead_status_idx" ON "ActiveLead"("status");

-- CreateIndex
CREATE INDEX "ActiveLead_score_idx" ON "ActiveLead"("score");

-- CreateIndex
CREATE INDEX "ActiveLead_lastMessageAt_idx" ON "ActiveLead"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ActiveLead_status_lastMessageAt_idx" ON "ActiveLead"("status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "ActiveLead_score_status_idx" ON "ActiveLead"("score", "status");

-- CreateIndex
CREATE INDEX "ActiveLead_createdAt_idx" ON "ActiveLead"("createdAt");

-- CreateIndex
CREATE INDEX "ColdLead_phone_idx" ON "ColdLead"("phone");

-- CreateIndex
CREATE INDEX "ColdLead_archivedAt_idx" ON "ColdLead"("archivedAt");

-- CreateIndex
CREATE INDEX "ColdLead_freezeReason_idx" ON "ColdLead"("freezeReason");

-- CreateIndex
CREATE INDEX "ColdLead_createdAt_idx" ON "ColdLead"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_chatwootMessageId_key" ON "Message"("chatwootMessageId");

-- CreateIndex
CREATE INDEX "Message_leadId_idx" ON "Message"("leadId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_syncStatus_idx" ON "Message"("syncStatus");

-- CreateIndex
CREATE INDEX "Message_leadId_createdAt_idx" ON "Message"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemLabel_title_key" ON "SystemLabel"("title");

-- CreateIndex
CREATE UNIQUE INDEX "SystemLabel_chatwootLabelId_key" ON "SystemLabel"("chatwootLabelId");

-- CreateIndex
CREATE INDEX "SystemLabel_title_idx" ON "SystemLabel"("title");

-- CreateIndex
CREATE INDEX "SystemLabel_category_idx" ON "SystemLabel"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Note_chatwootNoteId_key" ON "Note"("chatwootNoteId");

-- CreateIndex
CREATE INDEX "Note_leadId_idx" ON "Note"("leadId");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "JobLog_jobType_idx" ON "JobLog"("jobType");

-- CreateIndex
CREATE INDEX "JobLog_createdAt_idx" ON "JobLog"("createdAt");

-- CreateIndex
CREATE INDEX "JobLog_status_idx" ON "JobLog"("status");

-- CreateIndex
CREATE INDEX "ConversationMetric_leadId_idx" ON "ConversationMetric"("leadId");

-- CreateIndex
CREATE INDEX "ConversationMetric_converted_idx" ON "ConversationMetric"("converted");

-- CreateIndex
CREATE INDEX "ConversationMetric_createdAt_idx" ON "ConversationMetric"("createdAt");

-- CreateIndex
CREATE INDEX "SystemHealth_createdAt_idx" ON "SystemHealth"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_ActiveLeadToSystemLabel_AB_unique" ON "_ActiveLeadToSystemLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_ActiveLeadToSystemLabel_B_index" ON "_ActiveLeadToSystemLabel"("B");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ActiveLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "ActiveLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActiveLeadToSystemLabel" ADD CONSTRAINT "_ActiveLeadToSystemLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "ActiveLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActiveLeadToSystemLabel" ADD CONSTRAINT "_ActiveLeadToSystemLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "SystemLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
