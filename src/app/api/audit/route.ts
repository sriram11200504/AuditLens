// POST /api/audit – run AI audit on a contract
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auditContract } from '@/lib/auditor';
import { insertDocument, insertFinding } from '@/db/index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, rawText } = body as { title: string; rawText: string };

    if (!title || !rawText) {
      return NextResponse.json({ error: 'title and rawText are required' }, { status: 400 });
    }

    const result = await auditContract(rawText);

    const documentId = uuidv4();
    const now = Date.now();

    // Persist document
    insertDocument({
      id: documentId,
      title,
      rawText,
      status: 'audited',
      riskScore: result.riskScore,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      createdAt: now,
    });

    // Persist findings
    const findings = result.findings.map(f => ({
      ...f,
      id: uuidv4(),
      documentId,
      userDecision: 'pending' as const,
    }));
    for (const finding of findings) {
      insertFinding(finding);
    }

    return NextResponse.json({
      documentId,
      riskScore: result.riskScore,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      findings,
    });
  } catch (err) {
    console.error('[POST /api/audit]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

