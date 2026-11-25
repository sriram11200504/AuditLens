'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2, Clock, TrendingDown } from 'lucide-react';
import { Finding } from '@/lib/types';

interface TelemetryHeaderProps {
  riskScore: number;
  findings: Finding[];
  latencyMs: number;
  modelUsed: string;
}

export default function TelemetryHeader({ riskScore, findings, latencyMs, modelUsed }: TelemetryHeaderProps) {
  const verified = findings.filter(f => f.isCitationVerified).length;
  const total = findings.length;
  const accepted = findings.filter(f => f.userDecision === 'accepted').length;

  const riskColor =
    riskScore >= 70 ? 'text-rose-600' :
    riskScore >= 40 ? 'text-amber-600' :
    'text-emerald-600';

  const riskBg =
    riskScore >= 70 ? 'bg-rose-50 border-rose-200' :
    riskScore >= 40 ? 'bg-amber-50 border-amber-200' :
    'bg-emerald-50 border-emerald-200';

  const riskLabel =
    riskScore >= 70 ? 'HIGH EXPOSURE' :
    riskScore >= 40 ? 'MODERATE RISK' :
    'LOW RISK';

  return (
    <div className={`rounded-xl border p-4 mb-4 ${riskBg}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Risk Score */}
        <div className="flex items-center gap-3">
          <ShieldAlert size={24} className={riskColor} />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] mb-0.5">
              Risk Exposure Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold font-mono ${riskColor}`}>{riskScore}</span>
              <span className="text-sm text-[#9CA3AF]">/100</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${riskColor} bg-white/60 border border-current`}>
                {riskLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry grid */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-medium mb-0.5">
              <CheckCircle2 size={9} />
              Citations
            </div>
            <div className="text-sm font-bold text-[#0F172A] font-mono">
              {verified}/{total}
            </div>
            <div className="text-[10px] text-[#9CA3AF]">Verbatim</div>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-medium mb-0.5">
              <TrendingDown size={9} />
              Mitigated
            </div>
            <div className="text-sm font-bold text-emerald-700 font-mono">{accepted}</div>
            <div className="text-[10px] text-[#9CA3AF]">Accepted</div>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-1 text-[10px] text-[#6B7280] font-medium mb-0.5">
              <Clock size={9} />
              Latency
            </div>
            <div className="text-sm font-bold text-[#0F172A] font-mono">{latencyMs}ms</div>
            <div className="text-[10px] text-[#9CA3AF] truncate max-w-16">
              {modelUsed === 'gemini-2.5-flash' ? 'Gemini' : 'Fallback'}
            </div>
          </div>
        </div>
      </div>

      {/* Risk score bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              riskScore >= 70 ? 'bg-rose-500' : riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}

