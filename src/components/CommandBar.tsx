'use client';

import React from 'react';
import { Database, Cpu, ChevronDown, FilePlus, Download, BookOpen, FileText, Clock, X } from 'lucide-react';
import { Document } from '@/lib/types';

interface CommandBarProps {
  currentDocument: Document | null;
  savedDocuments: Document[];
  modelUsed: string;
  onLoadDocument: (id: string) => void;
  onNewAudit: () => void;
  onLoadSample: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export default function CommandBar({
  currentDocument,
  savedDocuments,
  modelUsed,
  onLoadDocument,
  onNewAudit,
  onLoadSample,
  onExport,
  isLoading,
}: CommandBarProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const engineLabel =
    modelUsed === 'gemini-2.5-flash'
      ? 'Gemini 2.5 Flash'
      : modelUsed === 'deterministic-fallback-v1'
      ? 'Fallback Analyzer'
      : 'Engine Ready';

  const isGemini = modelUsed === 'gemini-2.5-flash';

  return (
    <header className="bg-white border-b border-[#E5E7EB] h-14 flex items-center px-5 gap-4 shrink-0 shadow-sm z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-7 h-7 rounded-lg bg-[#0F172A] flex items-center justify-center">
          <span className="text-white text-xs font-bold tracking-tight">AL</span>
        </div>
        <span className="font-semibold text-[#0F172A] text-base tracking-tight">AuditLens</span>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 mr-auto">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Database size={10} />
          DB: SQLite Connected
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
          isGemini
            ? 'bg-violet-50 text-violet-700 border-violet-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <Cpu size={10} />
          {engineLabel}
        </span>
      </div>

      {/* Saved audits dropdown */}
      {savedDocuments.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#374151] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            <FileText size={12} />
            Saved Audits ({savedDocuments.length})
            <ChevronDown size={12} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#E5E7EB]">
                Recent Audits
              </div>
              <div className="max-h-64 overflow-y-auto">
                {savedDocuments.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => { onLoadDocument(doc.id); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] last:border-0 ${
                      currentDocument?.id === doc.id ? 'bg-[#F0F9FF]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-[#0F172A] leading-snug line-clamp-1">{doc.title}</span>
                      <RiskBadge score={doc.riskScore} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#9CA3AF]">
                        <Clock size={9} className="inline mr-0.5" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-[10px] font-medium ${doc.status === 'reviewed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {doc.status === 'reviewed' ? '● Reviewed' : '● Audited'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <button
        onClick={onLoadSample}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
      >
        <BookOpen size={12} />
        Load Sample Contract
      </button>

      <button
        onClick={onNewAudit}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0F172A] rounded-lg hover:bg-[#1E293B] transition-colors disabled:opacity-50"
      >
        <FilePlus size={12} />
        New Audit
      </button>

      {currentDocument && (
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#374151] border border-[#E5E7EB] bg-white rounded-lg hover:bg-[#F9FAFB] transition-colors"
        >
          <Download size={12} />
          Export Brief
        </button>
      )}
    </header>
  );
}

function RiskBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-rose-100 text-rose-700' :
    score >= 40 ? 'bg-amber-100 text-amber-700' :
    'bg-emerald-100 text-emerald-700';
  return (
    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${color}`}>
      {score}
    </span>
  );
}

