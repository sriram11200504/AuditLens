// GET /api/documents – list all saved audits
import { NextResponse } from 'next/server';
import { getAllDocuments } from '@/db/index';

export async function GET() {
  try {
    const documents = getAllDocuments();
    return NextResponse.json({ documents });
  } catch (err) {
    console.error('[GET /api/documents]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

