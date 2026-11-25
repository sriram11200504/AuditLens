'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Finding } from '@/lib/types';

interface ContractViewerProps {
  rawText: string;
  findings: Finding[];
  activeFindingId: string | null;
  onSelectFinding: (id: string) => void;
}

interface HighlightSegment {
  text: string;
  findingId?: string;
  severity?: 'high' | 'medium' | 'low';
  verified?: boolean;
}

function buildSegments(rawText: string, findings: Finding[]): HighlightSegment[] {
  // Only highlight verified citations
  const verifiedFindings = findings.filter(f => f.isCitationVerified);

  if (verifiedFindings.length === 0) {
    return [{ text: rawText }];
  }

  // Build a list of [start, end, findingId, severity] for all verified findings
  type Span = { start: number; end: number; findingId: string; severity: 'high' | 'medium' | 'low' };
  const spans: Span[] = [];

  const normalized = rawText.replace(/\s+/g, ' ');

  for (const f of verifiedFindings) {
    const normalizedQuote = f.exactQuote.replace(/\s+/g, ' ').trim();
    const idx = normalized.indexOf(normalizedQuote);
    if (idx !== -1) {
      // Map back to original text position (approximate by character count since we normalized)
      spans.push({ start: idx, end: idx + normalizedQuote.length, findingId: f.id, severity: f.severity });
    }
  }

  if (spans.length === 0) return [{ text: rawText }];

  // Sort spans by start, resolve overlaps by keeping first match
  spans.sort((a, b) => a.start - b.start);
  const nonOverlapping: Span[] = [];
  let lastEnd = 0;
  for (const s of spans) {
    if (s.start >= lastEnd) {
      nonOverlapping.push(s);
      lastEnd = s.end;
    }
  }

  // Build segments from normalized text
  const segments: HighlightSegment[] = [];
  let pos = 0;
  for (const span of nonOverlapping) {
    if (span.start > pos) {
      segments.push({ text: normalized.slice(pos, span.start) });
    }
    segments.push({
      text: normalized.slice(span.start, span.end),
      findingId: span.findingId,
      severity: span.severity,
      verified: true,
    });
    pos = span.end;
  }
  if (pos < normalized.length) {
    segments.push({ text: normalized.slice(pos) });
  }
  return segments;
}

const SEVERITY_STYLES: Record<string, { base: string; active: string }> = {
  high: {
    base: 'bg-rose-50 border-b-2 border-rose-400 cursor-pointer hover:bg-rose-100 transition-colors',
    active: 'bg-rose-100 border-b-2 border-rose-600 ring-1 ring-rose-300 rounded-sm',
  },
  medium: {
    base: 'bg-amber-50 border-b-2 border-amber-400 cursor-pointer hover:bg-amber-100 transition-colors',
    active: 'bg-amber-100 border-b-2 border-amber-600 ring-1 ring-amber-300 rounded-sm',
  },
  low: {
    base: 'bg-slate-50 border-b-2 border-slate-400 cursor-pointer hover:bg-slate-100 transition-colors',
    active: 'bg-slate-100 border-b-2 border-slate-600 ring-1 ring-slate-300 rounded-sm',
  },
};

export default function ContractViewer({
  rawText,
  findings,
  activeFindingId,
  onSelectFinding,
}: ContractViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const segments = buildSegments(rawText, findings);

  // Scroll active finding into view in the contract pane
  useEffect(() => {
    if (activeFindingId && spanRefs.current[activeFindingId]) {
      spanRefs.current[activeFindingId]!.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeFindingId]);

  const setSpanRef = useCallback(
    (findingId: string) => (el: HTMLSpanElement | null) => {
      spanRefs.current[findingId] = el;
    },
    []
  );

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <div className="px-8 py-6">
        <p
          className="text-sm leading-7 text-[#1E293B] font-mono whitespace-pre-wrap break-words"
          style={{ fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace', fontSize: '0.8125rem' }}
        >
          {segments.map((seg, idx) => {
            if (!seg.findingId) {
              return <span key={idx}>{seg.text}</span>;
            }
            const styles = SEVERITY_STYLES[seg.severity ?? 'low'];
            const isActive = seg.findingId === activeFindingId;
            return (
              <span
                key={idx}
                ref={setSpanRef(seg.findingId)}
                onClick={() => onSelectFinding(seg.findingId!)}
                className={`${styles.base} ${isActive ? styles.active : ''} px-0.5 rounded-sm`}
                title={`Click to view finding`}
              >
                {seg.text}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}

