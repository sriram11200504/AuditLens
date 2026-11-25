'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileSearch, Loader2, AlertCircle } from 'lucide-react';
import CommandBar from '@/components/CommandBar';
import ContractViewer from '@/components/ContractViewer';
import FindingCard from '@/components/FindingCard';
import TelemetryHeader from '@/components/TelemetryHeader';
import ExportModal from '@/components/ExportModal';
import NewAuditModal from '@/components/NewAuditModal';
import { Document, Finding } from '@/lib/types';
import { SAMPLE_CONTRACT_TITLE, SAMPLE_CONTRACT_TEXT } from '@/lib/sampleContract';
import { calculateRiskScore } from '@/lib/auditor';

type FilterType = 'all' | 'pending' | 'accepted' | 'dismissed';

export default function HomePage() {
  const [document, setDocument] = useState<Document | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<Document[]>([]);
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showNewAudit, setShowNewAudit] = useState(false);
  const findingRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load saved documents on mount
  useEffect(() => {
    fetchSavedDocuments();
  }, []);

  const fetchSavedDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setSavedDocuments(data.documents ?? []);
      }
    } catch {}
  };

  const loadDocument = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) throw new Error('Failed to load document');
      const data = await res.json();
      setDocument(data.document);
      setFindings(data.findings);
      setActiveFindingId(null);
      setFilter('all');
    } catch {
      setError('Failed to load document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runAudit = useCallback(async (title: string, rawText: string) => {
    setIsLoading(true);
    setError(null);
    setShowNewAudit(false);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, rawText }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Audit failed');
      }
      const data = await res.json();
      await loadDocument(data.documentId);
      await fetchSavedDocuments();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Audit failed. Please try again.');
      setIsLoading(false);
    }
  }, [loadDocument]);

  const handleLoadSample = useCallback(async () => {
    await runAudit(SAMPLE_CONTRACT_TITLE, SAMPLE_CONTRACT_TEXT);
  }, [runAudit]);

  const handleDecision = useCallback(async (findingId: string, decision: 'pending' | 'accepted' | 'dismissed') => {
    if (!document) return;

    // Optimistic update
    setFindings(prev => {
      const updated = prev.map(f => f.id === findingId ? { ...f, userDecision: decision } : f);
      const newScore = calculateRiskScore(updated.map(f => ({ severity: f.severity, userDecision: f.userDecision })));
      setDocument(d => d ? { ...d, riskScore: newScore } : d);
      return updated;
    });

    try {
      await fetch(`/api/findings/${findingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userDecision: decision }),
      });
    } catch {
      await loadDocument(document.id);
    }
  }, [document, loadDocument]);

  const handleSelectFinding = useCallback((id: string) => {
    setActiveFindingId(id);
    setTimeout(() => {
      const el = findingRefs.current[id];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }, []);

  const filteredFindings = findings.filter(f => {
    if (filter === 'all') return true;
    if (filter === 'pending') return f.userDecision === 'pending';
    if (filter === 'accepted') return f.userDecision === 'accepted';
    if (filter === 'dismissed') return f.userDecision === 'dismissed';
    return true;
  });

  const filterCounts = {
    all: findings.length,
    pending: findings.filter(f => f.userDecision === 'pending').length,
    accepted: findings.filter(f => f.userDecision === 'accepted').length,
    dismissed: findings.filter(f => f.userDecision === 'dismissed').length,
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'dismissed', label: 'Dismissed' },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA] overflow-hidden">
      <CommandBar
        currentDocument={document}
        savedDocuments={savedDocuments}
        modelUsed={document?.modelUsed ?? ''}
        onLoadDocument={loadDocument}
        onNewAudit={() => setShowNewAudit(true)}
        onLoadSample={handleLoadSample}
        onExport={() => setShowExport(true)}
        isLoading={isLoading}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane – Contract Viewer 55% */}
        <div className="w-[55%] flex flex-col border-r border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E7EB] shrink-0">
            <div className="flex items-center gap-2">
              <FileSearch size={14} className="text-[#6B7280]" />
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Source Contract</span>
              {document && <span className="text-xs text-[#9CA3AF]">— {document.title}</span>}
            </div>
            {document && (
              <span className="text-[10px] text-[#9CA3AF] font-mono">
                {document.rawText.length.toLocaleString()} chars
              </span>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <LoadingState message="Running AI audit…" />
            ) : error ? (
              <ErrorState message={error} onRetry={() => setError(null)} />
            ) : document ? (
              <ContractViewer
                rawText={document.rawText}
                findings={findings}
                activeFindingId={activeFindingId}
                onSelectFinding={handleSelectFinding}
              />
            ) : (
              <EmptyState onNewAudit={() => setShowNewAudit(true)} onLoadSample={handleLoadSample} />
            )}
          </div>
        </div>

        {/* Right Pane – Risk Triage Queue 45% */}
        <div className="w-[45%] flex flex-col bg-[#FAFAFA]">
          <div className="px-5 pt-4 pb-3 border-b border-[#E5E7EB] bg-white shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-[#374151] uppercase tracking-wider">Risk Triage Queue</span>
            </div>

            {document && findings.length > 0 && (
              <TelemetryHeader
                riskScore={document.riskScore}
                findings={findings}
                latencyMs={document.latencyMs}
                modelUsed={document.modelUsed}
              />
            )}

            {findings.length > 0 && (
              <div className="flex gap-1">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      filter === f.key ? 'bg-[#0F172A] text-white' : 'text-[#6B7280] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {f.label}
                    <span className={`text-[10px] px-1 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-[#E5E7EB]'}`}>
                      {filterCounts[f.key]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {!document && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-3">
                  <FileSearch size={20} className="text-[#9CA3AF]" />
                </div>
                <p className="text-sm font-medium text-[#374151]">No audit loaded</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Load a sample or run a new audit to begin.</p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 size={24} className="animate-spin text-[#0F172A]" />
                <p className="text-sm text-[#374151]">Extracting risk clauses…</p>
                <p className="text-xs text-[#9CA3AF]">Verifying citations against source text</p>
              </div>
            )}

            {!isLoading && document && filteredFindings.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-xs text-[#9CA3AF]">No findings match the current filter.</p>
              </div>
            )}

            {!isLoading && filteredFindings.length > 0 && (
              <div className="space-y-3">
                {filteredFindings.map(finding => (
                  <div key={finding.id} ref={el => { findingRefs.current[finding.id] = el; }}>
                    <FindingCard
                      finding={finding}
                      isActive={activeFindingId === finding.id}
                      onSelect={() => setActiveFindingId(finding.id)}
                      onDecision={(decision) => handleDecision(finding.id, decision)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showExport && document && (
        <ExportModal document={document} findings={findings} onClose={() => setShowExport(false)} />
      )}

      {showNewAudit && (
        <NewAuditModal
          onClose={() => setShowNewAudit(false)}
          onSubmit={runAudit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

function EmptyState({ onNewAudit, onLoadSample }: { onNewAudit: () => void; onLoadSample: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-4">
        <FileSearch size={28} className="text-[#9CA3AF]" />
      </div>
      <h2 className="text-base font-semibold text-[#0F172A] mb-1.5">No contract loaded</h2>
      <p className="text-sm text-[#6B7280] mb-5 max-w-xs leading-relaxed">
        Load a high-risk sample contract or paste your own to begin AI-powered risk triage.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onLoadSample}
          className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          Load Sample Contract
        </button>
        <button
          onClick={onNewAudit}
          className="px-4 py-2 text-sm font-medium text-white bg-[#0F172A] rounded-lg hover:bg-[#1E293B] transition-colors"
        >
          Paste Your Contract
        </button>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Loader2 size={28} className="animate-spin text-[#0F172A]" />
      <p className="text-sm font-medium text-[#374151]">{message}</p>
      <p className="text-xs text-[#9CA3AF]">This may take a few seconds with the Gemini API.</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
      <AlertCircle size={24} className="text-rose-500" />
      <p className="text-sm font-medium text-[#374151]">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-1.5 text-xs font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB]"
      >
        Dismiss
      </button>
    </div>
  );
}
