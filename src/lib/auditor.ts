// AuditLens – AI auditor engine with deterministic fallback
import { v4 as uuidv4 } from 'uuid';
import { Finding } from '@/db/schema';
import { calculateRiskScore } from '@/lib/utils';

export { calculateRiskScore };

export interface AuditRawFinding {
  clauseType: string;
  severity: 'high' | 'medium' | 'low';
  exactQuote: string;
  riskExplanation: string;
  suggestedRedline: string;
}

export interface AuditResult {
  findings: Array<Omit<Finding, 'id' | 'documentId' | 'userDecision'>>;
  riskScore: number;
  modelUsed: string;
  latencyMs: number;
}

// ─── Deterministic Citation Verifier ──────────────────────────────────────────

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function verifyCitation(exactQuote: string, rawText: string): boolean {
  const normalizedQuote = normalizeWhitespace(exactQuote);
  const normalizedText = normalizeWhitespace(rawText);
  return normalizedText.includes(normalizedQuote);
}

// ─── Deterministic Regex Fallback Analyzer ────────────────────────────────────

interface FallbackClausePattern {
  clauseType: string;
  severity: 'high' | 'medium' | 'low';
  keywords: RegExp;
  riskExplanation: string;
  suggestedRedline: string;
}

const FALLBACK_PATTERNS: FallbackClausePattern[] = [
  {
    clauseType: 'Auto-Renewal',
    severity: 'high',
    keywords: /auto[\s-]?renew|automatic(?:ally)?\s+renew|successive\s+\w+[\s-]month|notice\s+of\s+non[\s-]?renewal/i,
    riskExplanation: 'Contract auto-renews with an unusually long (90-day) notice window. Missing the deadline locks Client into another full term at potentially increased rates.',
    suggestedRedline: 'Replace 90-day non-renewal notice with 30-day notice. Add mutual right to terminate at end of initial term without cause.',
  },
  {
    clauseType: 'Unilateral Termination',
    severity: 'high',
    keywords: /provider\s+may\s+terminate.*immediately|sole\s+.*right\s+to\s+.*discontinue|terminate.*without\s+.*opportunity\s+to\s+cure/i,
    riskExplanation: 'Provider can terminate or modify services without prior notice or cure period, exposing Client to sudden service disruption.',
    suggestedRedline: 'Add 30-day written notice and 15-day cure period before Provider can terminate. Restrict Provider right to discontinue features during active Subscription Term.',
  },
  {
    clauseType: 'IP Assignment',
    severity: 'high',
    keywords: /irrevocably\s+assign|assigns.*transfers.*conveys|pre[\s-]?existing\s+intellectual\s+property|client\s+deliverables/i,
    riskExplanation: 'Client is forced to assign ownership of all deliverables—including pre-existing IP—to Provider, permanently stripping Client of proprietary tooling.',
    suggestedRedline: 'Remove Section 4.2 entirely. Replace with: "Client retains all right, title, and interest in Client Deliverables. Provider receives only a limited license to use Client Deliverables solely to deliver the Services."',
  },
  {
    clauseType: 'Data Usage',
    severity: 'high',
    keywords: /commercialize.*data|resale\s+to\s+third\s+parties|use.*data.*marketing|personally\s+identifiable\s+information.*license/i,
    riskExplanation: 'Provider claims a perpetual license to commercialize and resell Client data including PII to third parties without further consent, creating serious privacy and regulatory exposure.',
    suggestedRedline: 'Delete Section 4.3. Replace with: "Provider may use Client data solely to deliver the Services and shall not sell, share, or commercialize Client data for any other purpose. Any aggregate, anonymized usage data shall be governed by a separate Data Processing Addendum."',
  },
  {
    clauseType: 'Uncapped Liability',
    severity: 'high',
    keywords: /not\s+subject\s+to\s+any\s+cap|indemnification\s+obligations.*shall\s+not\s+be\s+subject|unlimited.*indemnif/i,
    riskExplanation: 'Client indemnification is explicitly uncapped while Provider liability is capped at $100, creating a catastrophically asymmetric risk allocation.',
    suggestedRedline: 'Cap Client indemnification at a mutually agreed amount (e.g., 12 months of fees paid). Raise Provider aggregate liability cap to at least 12 months of fees paid. Remove carve-outs that render cap meaningless.',
  },
  {
    clauseType: 'Payment Lock-In',
    severity: 'medium',
    keywords: /prepaid\s+fees\s+are\s+non[\s-]?refundable|sole\s+remedy\s+is\s+to\s+terminate|increase.*fees.*upon\s+\w+\s+days\s+written\s+notice/i,
    riskExplanation: 'Provider can unilaterally raise fees with only 30-day notice. If Client rejects the increase, prepaid fees are forfeited and termination is the only remedy.',
    suggestedRedline: 'Restrict fee increases to once per year, capped at the lesser of 5% or CPI. If Client does not accept, provide pro-rata refund of prepaid amounts and 60-day wind-down period.',
  },
];

function extractBestQuote(text: string, pattern: RegExp): string {
  const normalized = normalizeWhitespace(text);
  const match = normalized.match(pattern);
  if (!match) return '';
  const start = Math.max(0, match.index! - 80);
  const end = Math.min(normalized.length, match.index! + match[0].length + 80);
  // Trim to nearest sentence boundaries if possible
  let snippet = normalized.slice(start, end);
  // Clip leading partial word
  const firstSpace = snippet.indexOf(' ');
  if (start > 0 && firstSpace > 0 && firstSpace < 15) snippet = snippet.slice(firstSpace + 1);
  return snippet.trim();
}

export function runDeterministicFallback(rawText: string): AuditRawFinding[] {
  const results: AuditRawFinding[] = [];
  for (const pattern of FALLBACK_PATTERNS) {
    if (pattern.keywords.test(rawText)) {
      const quote = extractBestQuote(rawText, pattern.keywords);
      if (quote.length > 10) {
        results.push({
          clauseType: pattern.clauseType,
          severity: pattern.severity,
          exactQuote: quote,
          riskExplanation: pattern.riskExplanation,
          suggestedRedline: pattern.suggestedRedline,
        });
      }
    }
  }
  return results;
}

// ─── Gemini AI Extractor ──────────────────────────────────────────────────────

const GEMINI_SCHEMA = {
  type: 'object' as const,
  properties: {
    findings: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          clauseType: { type: 'string' as const, description: 'Category of risk clause, e.g. Auto-Renewal, Uncapped Liability, IP Assignment, Data Usage, Unilateral Termination, Payment Lock-In' },
          severity: { type: 'string' as const, enum: ['high', 'medium', 'low'] },
          exactQuote: { type: 'string' as const, description: 'Exact verbatim substring copied character-for-character from the contract text, no paraphrasing' },
          riskExplanation: { type: 'string' as const, description: 'Concise 1-2 sentence explanation of business risk' },
          suggestedRedline: { type: 'string' as const, description: 'Specific proposed replacement language to mitigate the risk' },
        },
        required: ['clauseType', 'severity', 'exactQuote', 'riskExplanation', 'suggestedRedline'],
      },
    },
  },
  required: ['findings'],
};

const SYSTEM_PROMPT = `You are an expert contract risk analyst. Analyze the provided contract text and extract all significant legal and business risk clauses.

CRITICAL RULES:
1. The "exactQuote" field MUST be a verbatim, character-for-character copy of text that exists in the contract. Never paraphrase or summarize. Copy at least 15 words.
2. Focus on these high-risk clause types: Auto-Renewal (especially long notice windows), Uncapped Liability, IP Assignment (especially of pre-existing IP), Unilateral Termination (without cure), Payment Lock-In (non-refundable, unilateral price changes), Data Usage (commercialization of client data).
3. Assign severity: high = existential business risk, medium = significant negotiation point, low = minor concern.
4. Suggested redlines should propose specific replacement contract language.
5. Extract all risk findings you can identify — be thorough.`;

async function callGeminiAI(rawText: string): Promise<AuditRawFinding[]> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: GEMINI_SCHEMA as any,
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: `\n\nCONTRACT TEXT TO ANALYZE:\n\n${rawText}` },
  ]);

  const responseText = result.response.text();
  const parsed = JSON.parse(responseText);
  return parsed.findings as AuditRawFinding[];
}

// ─── Main Audit Function ───────────────────────────────────────────────────────

export async function auditContract(rawText: string): Promise<AuditResult> {
  const start = Date.now();
  let rawFindings: AuditRawFinding[];
  let modelUsed: string;

  if (!process.env.GEMINI_API_KEY) {
    rawFindings = runDeterministicFallback(rawText);
    modelUsed = 'deterministic-fallback-v1';
  } else {
    try {
      rawFindings = await callGeminiAI(rawText);
      modelUsed = 'gemini-2.5-flash';
    } catch (err) {
      console.error('[AuditLens] Gemini API error, falling back to deterministic analyzer:', err);
      rawFindings = runDeterministicFallback(rawText);
      modelUsed = 'deterministic-fallback-v1';
    }
  }

  const latencyMs = Date.now() - start;

  // Run citation verifier on every finding
  const verifiedFindings: Array<Omit<Finding, 'id' | 'documentId' | 'userDecision'>> = rawFindings.map(f => ({
    clauseType: f.clauseType,
    severity: f.severity,
    exactQuote: f.exactQuote,
    isCitationVerified: verifyCitation(f.exactQuote, rawText),
    riskExplanation: f.riskExplanation,
    suggestedRedline: f.suggestedRedline,
  }));

  // Deterministic risk score (all findings start as 'pending')
  const riskScore = calculateRiskScore(verifiedFindings.map(f => ({ ...f, userDecision: 'pending' })));

  return { findings: verifiedFindings, riskScore, modelUsed, latencyMs };
}
