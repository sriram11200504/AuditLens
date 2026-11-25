// AuditLens – database schema (Drizzle ORM + better-sqlite3)
// Tables are auto-created on first run via src/db/index.ts

export interface Document {
  id: string;
  title: string;
  rawText: string;
  status: 'audited' | 'reviewed';
  riskScore: number;
  modelUsed: string;
  latencyMs: number;
  createdAt: number;
}

export interface Finding {
  id: string;
  documentId: string;
  clauseType: string;
  severity: 'high' | 'medium' | 'low';
  exactQuote: string;
  isCitationVerified: boolean;
  riskExplanation: string;
  suggestedRedline: string;
  userDecision: 'pending' | 'accepted' | 'dismissed';
}

export const CREATE_DOCUMENTS_SQL = `
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    rawText TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'audited',
    riskScore INTEGER NOT NULL DEFAULT 0,
    modelUsed TEXT NOT NULL DEFAULT 'unknown',
    latencyMs INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
  )
`;

export const CREATE_FINDINGS_SQL = `
  CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    documentId TEXT NOT NULL,
    clauseType TEXT NOT NULL,
    severity TEXT NOT NULL,
    exactQuote TEXT NOT NULL,
    isCitationVerified INTEGER NOT NULL DEFAULT 0,
    riskExplanation TEXT NOT NULL,
    suggestedRedline TEXT NOT NULL,
    userDecision TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
  )
`;

