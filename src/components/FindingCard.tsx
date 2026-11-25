'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Check, X, RotateCcw, ShieldCheck, ArrowRight } from 'lucide-react';
import { Finding } from '@/lib/types';

interface FindingCardProps {
  finding: Finding;
  isActive: boolean;
  onSelect: () => void;
  onDecision: (decision: 'accepted' | 'dismissed' | 'pending') => void;
}

const SEVERITY_CONFIG = {
  high: {
    pill: 'bg-rose-100 text-rose-700 border-rose-200',
    border: 'border-rose-200',
    activeRing: 'ring-2 ring-rose-300',
    quote: 'border-l-rose-400 bg-rose-50/60',
    card: 'bg-white',
  },
  medium: {
    pill: 'bg-amber-100 text-amber-700 border-amber-200',
    border: 'border-amber-200',
    activeRing: 'ring-2 ring-amber-300',
    quote: 'border-l-amber-400 bg-amber-50/60',
    card: 'bg-white',
  },
  low: {
    pill: 'bg-slate-100 text-slate-600 border-slate-200',
    border: 'border-slate-200',
    activeRing: 'ring-2 ring-slate-300',
    quote: 'border-l-slate-400 bg-slate-50/60',
    card: 'bg-white',
  },
};

export default function FindingCard({ finding, isActive, onSelect, onDecision }: FindingCardProps) {
  const cfg = SEVERITY_CONFIG[finding.severity];
  const isDismissed = finding.userDecision === 'dismissed';
  const isAccepted = finding.userDecision === 'accepted';

  let cardBg = 'bg-white';
  if (isAccepted) cardBg = 'bg-emerald-50/80';
  if (isDismissed) cardBg = 'bg-[#F9FAFB] opacity-60';

  return (
    <div
      id={`finding-${finding.id}`}
      onClick={onSelect}
      className={`
        rounded-xl border transition-all duration-150 cursor-pointer
        ${cfg.border} ${isActive ? cfg.activeRing : ''}
        ${cardBg}
        ${isDismissed ? 'opacity-60' : ''}
        hover:shadow-md
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.pill}`}>
            {finding.severity}
          </span>
          <span className="text-xs font-semibold text-[#0F172A]">{finding.clauseType}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {finding.isCitationVerified ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 size={9} />
              VERIFIED
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              <AlertTriangle size={9} />
              UNVERIFIED
            </span>
          )}
          {isAccepted && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-full">
              <ShieldCheck size={9} />
              MITIGATED
            </span>
          )}
          {isDismissed && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
              DISMISSED
            </span>
          )}
        </div>
      </div>

      {/* Verbatim quote */}
      <div className={`mx-4 px-3 py-2.5 rounded-lg border-l-4 ${cfg.quote} mb-2.5`}>
        <p className="text-xs font-mono text-[#374151] leading-relaxed italic">
          &ldquo;{finding.exactQuote}&rdquo;
        </p>
      </div>

      {/* Risk explanation */}
      <div className="px-4 pb-2.5">
        <p className="text-xs text-[#4B5563] leading-relaxed">{finding.riskExplanation}</p>
      </div>

      {/* Suggested redline */}
      {!isDismissed && (
        <div className="mx-4 mb-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2.5">
          <div className="flex items-center gap-1 mb-1">
            <ArrowRight size={10} className="text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Suggested Redline</span>
          </div>
          <p className="text-xs text-[#166534] leading-relaxed">{finding.suggestedRedline}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 pb-3.5" onClick={e => e.stopPropagation()}>
        {finding.userDecision !== 'accepted' && (
          <button
            onClick={() => onDecision('accepted')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Check size={11} />
            Accept Redline
          </button>
        )}
        {finding.userDecision !== 'dismissed' && (
          <button
            onClick={() => onDecision('dismissed')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            <X size={11} />
            Dismiss
          </button>
        )}
        {finding.userDecision !== 'pending' && (
          <button
            onClick={() => onDecision('pending')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

