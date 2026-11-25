// AuditLens – database connection + auto-initialization
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_DOCUMENTS_SQL, CREATE_FINDINGS_SQL, Document, Finding } from './schema';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'auditlens.db');

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    // Auto-create tables
    _db.exec(CREATE_DOCUMENTS_SQL);
    _db.exec(CREATE_FINDINGS_SQL);
  }
  return _db;
}

// ─── Documents ─────────────────────────────────────────────────────────────────

export function insertDocument(doc: Document): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO documents (id, title, rawText, status, riskScore, modelUsed, latencyMs, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(doc.id, doc.title, doc.rawText, doc.status, doc.riskScore, doc.modelUsed, doc.latencyMs, doc.createdAt);
}

export function getAllDocuments(): Document[] {
  const db = getDb();
  return db.prepare('SELECT * FROM documents ORDER BY createdAt DESC').all() as Document[];
}

export function getDocumentById(id: string): Document | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as Document | undefined;
}

export function updateDocumentRiskAndStatus(id: string, riskScore: number, status: 'audited' | 'reviewed'): void {
  const db = getDb();
  db.prepare('UPDATE documents SET riskScore = ?, status = ? WHERE id = ?').run(riskScore, status, id);
}

// ─── Findings ──────────────────────────────────────────────────────────────────

export function insertFinding(finding: Finding): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO findings (id, documentId, clauseType, severity, exactQuote, isCitationVerified, riskExplanation, suggestedRedline, userDecision)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    finding.id,
    finding.documentId,
    finding.clauseType,
    finding.severity,
    finding.exactQuote,
    finding.isCitationVerified ? 1 : 0,
    finding.riskExplanation,
    finding.suggestedRedline,
    finding.userDecision
  );
}

export function getFindingsByDocumentId(documentId: string): Finding[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM findings WHERE documentId = ? ORDER BY rowid ASC').all(documentId) as Array<Omit<Finding, 'isCitationVerified'> & { isCitationVerified: number }>;
  return rows.map(r => ({ ...r, isCitationVerified: r.isCitationVerified === 1 }));
}

export function getFindingById(id: string): Finding | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM findings WHERE id = ?').get(id) as (Omit<Finding, 'isCitationVerified'> & { isCitationVerified: number }) | undefined;
  if (!row) return undefined;
  return { ...row, isCitationVerified: row.isCitationVerified === 1 };
}

export function updateFindingDecision(id: string, decision: 'pending' | 'accepted' | 'dismissed'): void {
  const db = getDb();
  db.prepare('UPDATE findings SET userDecision = ? WHERE id = ?').run(decision, id);
}

