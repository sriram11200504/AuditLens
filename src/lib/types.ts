// AuditLens shared types for the frontend
import { Document, Finding } from '@/db/schema';

export type { Document, Finding };

export interface AuditState {
  document: Document | null;
  findings: Finding[];
  activeFindingId: string | null;
  activeFilter: 'all' | 'pending' | 'accepted' | 'dismissed';
  isLoading: boolean;
  isExportOpen: boolean;
}

export interface DocumentListItem {
  id: string;
  title: string;
  riskScore: number;
  status: string;
  modelUsed: string;
  createdAt: number;
}

