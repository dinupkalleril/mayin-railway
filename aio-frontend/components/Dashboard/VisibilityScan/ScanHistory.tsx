'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface ScanHistoryProps {
  userId: string;
  aiModel: string;
  modelVersion?: string;
}

export default function ScanHistory({ userId, aiModel, modelVersion }: ScanHistoryProps) {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      // Cleanup stuck scans first, then fetch
      cleanupStuckScans().then(() => fetchScans());
    }
  }, [userId, aiModel, modelVersion]);

  const cleanupStuckScans = async () => {
    try {
      await fetch(
        `/api/visibility/cleanup/${userId}`,
        { method: 'POST' }
      );
    } catch (error) {
      // Silently fail - cleanup is optional
    }
  };

  const fetchScans = async () => {
    try {
      let url = `/api/visibility/scans/${userId}?aiModel=${aiModel}`;
      if (modelVersion) {
        url += `&modelVersion=${encodeURIComponent(modelVersion)}`;
      }
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelScan = async (scanId: string) => {
    setCancellingId(scanId);
    try {
      const response = await fetch(
        `/api/visibility/scan/${scanId}/cancel`,
        { method: 'PUT' }
      );

      if (response.ok) {
        // Refresh scans list
        await fetchScans();
      }
    } catch (error) {
      console.error('Error cancelling scan:', error);
    } finally {
      setCancellingId(null);
    }
  };

  // Check if a scan is stuck (pending/running for more than 10 minutes)
  const isStuck = (scan: any) => {
    if (scan.status !== 'pending' && scan.status !== 'running') return false;
    const createdAt = new Date(scan.created_at).getTime();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return createdAt < tenMinutesAgo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-railway-border border-t-primary-500"></div>
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-railway-elevated border border-railway-border flex items-center justify-center">
          <svg className="w-8 h-8 text-railway-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-railway-white mb-2">No Scans Yet</h3>
        <p className="text-railway-muted text-sm">
          Start your first scan to see results here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scans.map((scan) => {
        const stuck = isStuck(scan);

        return (
          <div
            key={scan.id}
            className={`group bg-railway-elevated border rounded-xl p-5 transition-all ${
              stuck
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-railway-border hover:border-railway-border-hover'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h3 className="font-semibold text-railway-white truncate">{scan.brand_name}</h3>
                  <Badge
                    variant={
                      scan.status === 'completed' ? 'success' :
                      scan.status === 'running' ? 'info' :
                      scan.status === 'failed' ? 'error' : 'default'
                    }
                    size="sm"
                    dot
                  >
                    {stuck ? 'stuck' : scan.status}
                  </Badge>
                  {scan.model_version && (
                    <span className="text-xs text-railway-muted bg-railway-dark px-2 py-0.5 rounded">
                      {/* Format alias like "chatgpt.fast" to "Fast" or display as-is if not an alias */}
                      {scan.model_version.includes('.')
                        ? scan.model_version.split('.')[1].charAt(0).toUpperCase() + scan.model_version.split('.')[1].slice(1) + ' Tier'
                        : scan.model_version}
                    </span>
                  )}
                  {stuck && (
                    <span className="text-xs text-yellow-400">
                      (running too long)
                    </span>
                  )}
                </div>

                {scan.status === 'failed' && scan.error_message && (
                  <p className="text-sm text-red-400 mb-3 bg-red-500/10 px-3 py-2 rounded-lg">
                    {scan.error_message}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-railway-muted mb-1">Score</p>
                    <p className={`text-xl font-bold ${
                      scan.score >= 70 ? 'text-green-400' :
                      scan.score >= 40 ? 'text-yellow-400' :
                      scan.score !== null ? 'text-red-400' : 'text-railway-muted'
                    }`}>
                      {scan.score !== null ? `${scan.score}%` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-railway-muted mb-1">Prompts</p>
                    <p className="text-xl font-bold text-railway-white">{scan.prompt_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-railway-muted mb-1">Mentions</p>
                    <p className="text-xl font-bold text-primary-400">
                      {scan.mentioned_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-railway-muted mb-1">Date</p>
                    <p className="text-sm text-railway-gray">
                      {new Date(scan.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {/* Cancel button for running/pending scans */}
                {(scan.status === 'running' || scan.status === 'pending') && (
                  <button
                    onClick={() => cancelScan(scan.id)}
                    disabled={cancellingId === scan.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg transition-all text-sm font-medium"
                  >
                    {cancellingId === scan.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    Cancel
                  </button>
                )}

                {/* Actions for completed scans */}
                {scan.status === 'completed' && (
                  <>
                    <Link
                      href={`/dashboard/visibility/${scan.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-railway-dark hover:bg-railway-card text-railway-gray hover:text-railway-white border border-railway-border rounded-lg transition-all text-sm font-medium"
                    >
                      View
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </>
                )}


              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
