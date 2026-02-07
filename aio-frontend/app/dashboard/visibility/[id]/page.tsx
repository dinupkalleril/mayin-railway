'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';

interface Competitor {
  name: string;
  mentions: number;
}

interface PromptAnswer {
  prompt: string;
  answer: string;
  mentioned: boolean;
}

interface ScanDetails {
  id: string;
  user_id: string;
  ai_model: string;
  brand_name: string;
  brand_info: any;
  prompt_count: number;
  status: string;
  score: number | null;
  mentioned_count: number | null;
  competitors: Competitor[];
  prompts_and_answers: PromptAnswer[];
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export default function ScanDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = Array.isArray(params?.id) ? params?.id[0] : (params?.id || '');

  const [scan, setScan] = useState<ScanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (scanId) {
      fetchScanDetails();
    }
  }, [scanId]);

  const fetchScanDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/visibility/scan/${scanId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch scan details');
      }

      const data = await response.json();
      setScan(data.scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scan details');
    } finally {
      setLoading(false);
    }
  };

  const togglePrompt = (index: number) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPrompts(newExpanded);
  };

  const expandAll = () => {
    if (scan?.prompts_and_answers) {
      setExpandedPrompts(new Set(scan.prompts_and_answers.map((_, i) => i)));
    }
  };

  const collapseAll = () => {
    setExpandedPrompts(new Set());
  };

  if (!scanId || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Loading scan details...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-neutral-100 mb-2">Error Loading Scan</h3>
        <p className="text-neutral-400 mb-6">{error || 'Scan not found'}</p>
        <button
          onClick={() => router.push('/dashboard/visibility')}
          className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          Back to Visibility Scans
        </button>
      </div>
    );
  }

  const aiModelInfo: Record<string, { name: string; icon: string; color: string }> = {
    chatgpt: { name: 'ChatGPT', icon: '🤖', color: 'bg-green-500' },
    claude: { name: 'Claude', icon: '🎭', color: 'bg-purple-500' },
    gemini: { name: 'Gemini', icon: '✨', color: 'bg-blue-500' },
    perplexity: { name: 'Perplexity', icon: '🔍', color: 'bg-indigo-500' },
    grok: { name: 'Grok', icon: '⚡', color: 'bg-orange-500' },
  };

  const modelInfo = aiModelInfo[scan.ai_model] || { name: scan.ai_model, icon: '🤖', color: 'bg-gray-500' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/visibility')}
          className="text-neutral-400 hover:text-neutral-100 mb-4 flex items-center gap-2"
        >
          ← Back to Visibility Scans
        </button>
        <h1 className="text-3xl font-bold text-neutral-100">Scan Details</h1>
      </div>

      {/* Overview Card */}
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{modelInfo.icon}</span>
                <h2 className="text-2xl font-bold text-neutral-100">{scan.brand_name}</h2>
              </div>
              <p className="text-neutral-400">
                Scanned with {modelInfo.name} on {new Date(scan.created_at).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={scan.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-neutral-950 p-4 rounded-lg">
              <p className="text-xs text-neutral-400 mb-1">Visibility Score</p>
              <p className="text-3xl font-bold text-neutral-100">
                {scan.score !== null ? `${scan.score}` : '-'}
                <span className="text-lg text-neutral-400">/100</span>
              </p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-lg">
              <p className="text-xs text-neutral-400 mb-1">Brand Mentions</p>
              <p className="text-3xl font-bold text-neutral-100">{scan.mentioned_count || 0}</p>
              <p className="text-xs text-neutral-500">out of {scan.prompt_count} prompts</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-lg">
              <p className="text-xs text-neutral-400 mb-1">Total Prompts</p>
              <p className="text-3xl font-bold text-neutral-100">{scan.prompt_count}</p>
            </div>
            <div className="bg-neutral-950 p-4 rounded-lg">
              <p className="text-xs text-neutral-400 mb-1">Competitors Found</p>
              <p className="text-3xl font-bold text-neutral-100">{scan.competitors?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors Card */}
      {scan.competitors && scan.competitors.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="text-xl font-bold text-neutral-100 mb-4">Top Competitors Mentioned</h3>
            <div className="space-y-2">
              {scan.competitors.map((competitor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400 font-mono text-sm">#{index + 1}</span>
                    <span className="font-medium text-neutral-100">{competitor.name}</span>
                  </div>
                  <span className="text-neutral-400 text-sm">
                    {competitor.mentions} mention{competitor.mentions !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prompts and Answers Card */}
      {scan.prompts_and_answers && scan.prompts_and_answers.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-100">Prompts & Answers</h3>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-1 text-sm bg-neutral-900 text-neutral-100 rounded hover:bg-neutral-800 transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-1 text-sm bg-neutral-900 text-neutral-100 rounded hover:bg-neutral-800 transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {scan.prompts_and_answers.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-lg transition-all ${
                    item.mentioned
                      ? 'border-green-500 bg-green-950/20'
                      : 'border-neutral-800 bg-neutral-950'
                  }`}
                >
                  <button
                    onClick={() => togglePrompt(index)}
                    className="w-full p-4 text-left hover:bg-neutral-900/50 transition-colors rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-neutral-400 font-mono text-xs">
                            Prompt #{index + 1}
                          </span>
                          {item.mentioned && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                              ✓ Brand Mentioned
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-100 text-sm line-clamp-2">{item.prompt}</p>
                      </div>
                      <span className="text-neutral-400 text-xl">
                        {expandedPrompts.has(index) ? '−' : '+'}
                      </span>
                    </div>
                  </button>

                  {expandedPrompts.has(index) && (
                    <div className="px-4 pb-4 space-y-3 border-t border-neutral-800 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 mb-2">PROMPT:</p>
                        <p className="text-sm text-neutral-100 bg-neutral-900 p-3 rounded">
                          {item.prompt}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-400 mb-2">ANSWER:</p>
                        <p className="text-sm text-neutral-100 bg-neutral-900 p-3 rounded whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {scan.error_message && (
        <Card>
          <CardContent>
            <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
            <p className="text-neutral-300">{scan.error_message}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-4 py-2 rounded-full text-sm font-medium ${
        colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
