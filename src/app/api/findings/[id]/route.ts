// PATCH /api/findings/[id] – update userDecision, recalculate risk score
import { NextRequest, NextResponse } from 'next/server';
import {
  getFindingById,
  updateFindingDecision,
  getFindingsByDocumentId,
  updateDocumentRiskAndStatus,
} from '@/db/index';
import { calculateRiskScore } from '@/lib/auditor';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userDecision } = body as { userDecision: 'pending' | 'accepted' | 'dismissed' };

    if (!['pending', 'accepted', 'dismissed'].includes(userDecision)) {
      return NextResponse.json({ error: 'Invalid userDecision value' }, { status: 400 });
    }

    const finding = getFindingById(id);
    if (!finding) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }

    // Update finding decision
    updateFindingDecision(id, userDecision);

    // Recalculate document risk score
    const allFindings = getFindingsByDocumentId(finding.documentId);
    const updatedFindings = allFindings.map(f =>
      f.id === id ? { ...f, userDecision } : f
    );

    const newRiskScore = calculateRiskScore(updatedFindings);

    // Determine new status: 'reviewed' if all findings triaged
    const allTriaged = updatedFindings.every(f => f.userDecision !== 'pending');
    const newStatus = allTriaged ? 'reviewed' : 'audited';

    updateDocumentRiskAndStatus(finding.documentId, newRiskScore, newStatus);

    return NextResponse.json({
      finding: { ...finding, userDecision },
      documentRiskScore: newRiskScore,
      documentStatus: newStatus,
    });
  } catch (err) {
    console.error('[PATCH /api/findings/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

