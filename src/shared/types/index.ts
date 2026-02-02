// src/shared/types/index.ts

export interface ILead {
  id: string;
  phone: string;
  name: string;
  email?: string;
  company?: string;
  score: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id: string;
  leadId: string;
  content: string;
  type: 'incoming' | 'outgoing';
  isAiGenerated: boolean;
  createdAt: Date;
}

export interface IWebhookPayload {
  phone: string;
  name?: string;
  message: string;
  messageId?: string;
  timestamp?: string;
}

export interface IClassificationResult {
  intent: 'BUY_NOW' | 'SUPPORT' | 'TRIAGE';
  confidence: number;
  reasoning: string;
}

export interface IJobLog {
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  leadsProcessed: number;
  leadsSkipped: number;
  duration?: number;
  error?: string;
}
