'use client';

import React from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import { SAMPLE_CONTRACT_TITLE, SAMPLE_CONTRACT_TEXT } from '@/lib/sampleContract';

interface NewAuditModalProps {
  onClose: () => void;
  onSubmit: (title: string, rawText: string) => void;
  isLoading: boolean;
}

export default function NewAuditModal({ onClose, onSubmit, isLoading }: NewAuditModalProps) {
  const [title, setTitle] = React.useState('');
  const [rawText, setRawText] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please provide a document title.'); return; }
    if (rawText.trim().length < 50) { setError('Contract text is too short. Paste the full contract.'); return; }
    setError('');
    onSubmit(title.trim(), rawText.trim());
  };

  const handlePasteSample = () => {
    setTitle(SAMPLE_CONTRACT_TITLE);
    setRawText(SAMPLE_CONTRACT_TEXT);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#0F172A]" />
            <span className="font-semibold text-[#0F172A]">New Contract Audit</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Acme Corp Vendor MSA 2024"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A] transition-all"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#374151]">
                  Contract Text
                </label>
                <button
                  type="button"
                  onClick={handlePasteSample}
                  className="text-xs text-[#6B7280] hover:text-[#0F172A] underline underline-offset-2"
                >
                  Paste sample contract
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste the full contract text here…"
                rows={16}
                className="w-full px-3 py-2.5 text-xs font-mono border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A] transition-all resize-none leading-relaxed"
              />
              <div className="mt-1 text-[10px] text-[#9CA3AF]">
                {rawText.length.toLocaleString()} characters · {rawText.split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-[#0F172A] rounded-lg hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                'Run AI Audit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

