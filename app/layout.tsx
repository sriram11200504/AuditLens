// Root app layout – Google Fonts removed (sandbox/offline compatible)
// AuditLens uses src/app/ as the primary app directory
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AuditLens — AI Contract & SLA Risk Triage',
  description: 'Production-grade AI contract risk analysis with citation verification and deterministic scoring.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-[#FAFAFA] text-[#0F172A]">{children}</body>
    </html>
  );
}
