'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScanResultsProps {
  scanId: string;
}

export default function ScanResults({ scanId }: ScanResultsProps) {
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [networkNote, setNetworkNote] = useState<string | null>(null);
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let delay = 3000;

    const loop = async () => {
      if (cancelled) return;
      const ok = await fetchScanResults();
      if (!ok) {
        // Exponential-ish backoff on network errors
        delay = Math.min(delay + 2000, 15000);
      } else {
        delay = 3000;
      }
      if (!cancelled && (!scan || (scan.status !== 'completed' && scan.status !== 'failed'))) {
        setTimeout(loop, delay);
      }
    };

    loop();
    return () => { cancelled = true; };
  }, [scanId]);

  const fetchScanResults = async () => {
    try {
      const response = await fetch(
        `/api/visibility/scan/${scanId}`,
        { cache: 'no-store', keepalive: true }
      );

      if (response.ok) {
        const data = await response.json();
        setScan(data.scan);
        setNetworkNote(null);

        // Stop polling if scan is complete or failed
        if (data.scan.status === 'completed' || data.scan.status === 'failed') {
          setLoading(false);
        }
        return true;
      } else {
        setNetworkNote('Temporary network issue fetching status. Retrying...');
        return false;
      }
    } catch (error) {
      console.error('Error fetching scan:', error);
      setNetworkNote('Network error while fetching status. Retrying...');
      return false;
    }
  };

  if (!scan) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (scan.status === 'pending' || scan.status === 'running') {
    return (
      <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <div>
            <h3 className="font-semibold text-railway-white">Scan in Progress</h3>
            <p className="text-sm text-railway-gray">
              {scan.status === 'pending' ? 'Starting scan...' : 'Processing prompts...'}
            </p>
            {networkNote && (
              <p className="text-xs text-yellow-400 mt-1">{networkNote}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (scan.status === 'failed') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <h3 className="font-semibold text-red-400 mb-2">Scan Failed</h3>
        <p className="text-sm text-red-300">{scan.error_message || 'Unknown error occurred'}</p>
      </div>
    );
  }

  const prompts = scan.prompts_and_answers || [];
  const displayedPrompts = showAllPrompts ? prompts : prompts.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl p-8 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Visibility Score</h2>
            <p className="text-white/80">
              Your brand was mentioned in {scan.mentioned_count} out of {scan.prompt_count} prompts
            </p>
          </div>
          <div className="text-6xl font-bold">
            {scan.score}
            <span className="text-3xl opacity-70">/100</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Prompts"
          value={scan.prompt_count}
          icon="prompts"
          color="blue"
        />
        <StatCard
          title="Brand Mentions"
          value={scan.mentioned_count}
          icon="mentions"
          color="green"
        />
        <StatCard
          title="Competitors Found"
          value={(scan.competitors || []).length}
          icon="competitors"
          color="orange"
        />
      </div>

      {/* Competitors */}
      {scan.competitors && scan.competitors.length > 0 && (
        <div className="bg-railway-card rounded-xl border border-railway-border p-6">
          <h3 className="font-semibold text-railway-white mb-4">Top Competitors Mentioned</h3>
          <div className="space-y-3">
            {scan.competitors.slice(0, 10).map((competitor: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-railway-white font-medium">{competitor.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-railway-dark rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((competitor.mentions / scan.prompt_count) * 100 * 3, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-railway-gray w-16 text-right">
                    {competitor.mentions}×
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompts and Answers */}
      <div className="bg-railway-card rounded-xl border border-railway-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-railway-white">Prompts & Answers</h3>
          {prompts.length > 10 && (
            <button
              onClick={() => setShowAllPrompts(!showAllPrompts)}
              className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              {showAllPrompts ? 'Show Less' : `View All ${prompts.length} Prompts`}
            </button>
          )}
        </div>

        <div className="space-y-4">
          {displayedPrompts.map((item: any, index: number) => (
            <div
              key={index}
              className={`border rounded-xl p-4 transition-all ${
                item.mentioned
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-railway-border bg-railway-elevated'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  item.mentioned
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.mentioned ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-railway-white mb-2">{item.prompt}</p>
                  <p className="text-sm text-railway-gray bg-railway-dark rounded-lg p-3 border border-railway-border whitespace-pre-wrap">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat card icons as SVG components
const StatIcons = {
  prompts: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  mentions: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  competitors: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const colorStyles = {
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'bg-blue-500/20 text-blue-400',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'bg-green-500/20 text-green-400',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: 'bg-orange-500/20 text-orange-400',
  },
};

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: keyof typeof StatIcons; color: keyof typeof colorStyles }) {
  const styles = colorStyles[color];

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-5 transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-railway-gray font-medium">{title}</p>
          <p className="text-3xl font-bold text-railway-white mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.icon}`}>
          {StatIcons[icon]}
        </div>
      </div>
    </div>
  );
}
