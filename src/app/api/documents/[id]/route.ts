// GET /api/documents/[id] – fetch document + all findings
import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, getFindingsByDocumentId } from '@/db/index';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = getDocumentById(id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const findings = getFindingsByDocumentId(id);
    return NextResponse.json({ document, findings });
  } catch (err) {
    console.error('[GET /api/documents/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

