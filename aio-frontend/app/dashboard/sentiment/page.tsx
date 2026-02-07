'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBrand } from '@/context/BrandContext'; // Import useBrand

export default function SentimentPage() {
  const { selectedBrand, loading: brandsLoading, error: brandsError } = useBrand(); // Use selectedBrand from context
  const [userId, setUserId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
      loadAnalysisHistory(id);
    }
  }, []);

  useEffect(() => {
    if (currentAnalysis && (currentAnalysis.status === 'pending' || currentAnalysis.status === 'running')) {
      const interval = setInterval(() => {
        fetchAnalysisStatus(currentAnalysis.id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [currentAnalysis]);

  const loadAnalysisHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/sentiment/analyses/${userId}?limit=5`);

      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data.analyses || []);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  };

  const fetchAnalysisStatus = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/sentiment/${analysisId}`);

      if (response.ok) {
        const data = await response.json();
        setCurrentAnalysis(data.analysis);

        if (data.analysis.status === 'completed' || data.analysis.status === 'failed') {
          loadAnalysisHistory(userId);
        }
      }
    } catch (error) {
      console.error('Error fetching analysis status:', error);
    }
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAnalyzing(true);

    if (!selectedBrand) {
        setError('No brand selected. Please select a brand to start sentiment analysis.');
        setIsAnalyzing(false);
        return;
    }

    try {
      const response = await fetch(
        `/api/sentiment/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            brandName: selectedBrand.brandName,
            location: selectedBrand.location
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      setCurrentAnalysis({ id: data.analysisId, status: 'pending' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return {
          gradient: 'from-green-500/20 to-emerald-500/10',
          border: 'border-green-500/30',
          text: 'text-green-400',
          glow: 'shadow-green-500/20',
          icon: '✓'
        };
      case 'negative':
        return {
          gradient: 'from-red-500/20 to-rose-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          glow: 'shadow-red-500/20',
          icon: '✗'
        };
      default:
        return {
          gradient: 'from-blue-500/20 to-indigo-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          glow: 'shadow-blue-500/20',
          icon: '○'
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (brandsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (brandsError) {
    return <div className="text-red-500">Error loading brands: {brandsError}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-railway-white">Sentiment Analysis</h1>
        <p className="text-railway-gray mt-1">
          Analyze your brand's web presence and sentiment
        </p>
      </div>

      {/* Analysis Form */}
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-railway-white mb-4">Start New Analysis</h2>

          <form onSubmit={handleStartAnalysis} className="space-y-4">
            {!selectedBrand && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-4 py-3 rounded-lg text-sm">
                    No brand selected. Please add or select a brand to start sentiment analysis.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-railway-gray mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={selectedBrand?.brandName || ''}
                  readOnly
                  placeholder="Select a brand"
                  className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-railway-gray mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={selectedBrand?.location || ''}
                  readOnly
                  placeholder="e.g., United States, Global"
                  className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isAnalyzing || !selectedBrand}
              loading={isAnalyzing}
              className="w-full"
              size="lg"
            >
              {isAnalyzing ? 'Starting Analysis...' : 'Analyze Brand Sentiment'}
            </Button>

            <p className="text-xs text-railway-muted text-center">
              Analysis takes 1-2 minutes. We'll search the web and analyze brand sentiment.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Current Analysis Results */}
      {currentAnalysis && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-railway-white mb-4">Analysis Results</h2>

            {(currentAnalysis.status === 'pending' || currentAnalysis.status === 'running') && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-400">Analyzing Brand Sentiment...</h3>
                    <p className="text-sm text-blue-300/80">
                      Searching web and analyzing mentions
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentAnalysis.status === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-red-400 mb-2">Analysis Failed</h3>
                <p className="text-sm text-red-300/80">
                  {currentAnalysis.error_message || 'Unknown error occurred'}
                </p>
              </div>
            )}

            {currentAnalysis.status === 'completed' && (
              <div className="space-y-6">
                {/* Overall Sentiment Card - Modern Railway Style */}
                {(() => {
                  const config = getSentimentConfig(currentAnalysis.overall_sentiment);
                  return (
                    <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} ${config.border} border rounded-2xl p-6 shadow-xl ${config.glow}`}>
                      {/* Background decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16" />

                      <div className="relative flex items-center justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-xl bg-railway-dark/50 border ${config.border} flex items-center justify-center`}>
                              <svg className={`w-5 h-5 ${config.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-railway-gray">Overall Sentiment</span>
                          </div>
                          <div className={`text-3xl font-bold ${config.text} capitalize`}>
                            {currentAnalysis.overall_sentiment}
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <p className="text-xs font-medium text-railway-muted uppercase tracking-wider">Web Presence</p>
                          <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-bold ${getScoreColor(currentAnalysis.web_presence_score)}`}>
                              {currentAnalysis.web_presence_score}
                            </span>
                            <span className="text-lg text-railway-muted">/100</span>
                          </div>
                          {/* Mini progress bar */}
                          <div className="w-24 h-1.5 bg-railway-dark/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                currentAnalysis.web_presence_score >= 70 ? 'bg-green-500' :
                                currentAnalysis.web_presence_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${currentAnalysis.web_presence_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Positive Aspects */}
                {currentAnalysis.positive_aspects && currentAnalysis.positive_aspects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-railway-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      Positive Aspects
                      <span className="text-xs font-normal text-railway-muted bg-railway-elevated px-2 py-0.5 rounded-full">
                        {currentAnalysis.positive_aspects.length} items
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {currentAnalysis.positive_aspects.map((aspect: string, index: number) => (
                        <div key={index} className="group bg-railway-elevated hover:bg-railway-card border border-railway-border hover:border-green-500/30 rounded-xl p-4 transition-all duration-200">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5">
                              <span className="text-green-400 text-xs">✓</span>
                            </span>
                            <p className="text-sm text-railway-gray group-hover:text-railway-white transition-colors">{aspect}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Areas for Improvement */}
                {currentAnalysis.negative_aspects && currentAnalysis.negative_aspects.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-railway-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      Areas for Improvement
                      <span className="text-xs font-normal text-railway-muted bg-railway-elevated px-2 py-0.5 rounded-full">
                        {currentAnalysis.negative_aspects.length} items
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {currentAnalysis.negative_aspects.map((aspect: string, index: number) => (
                        <div key={index} className="group bg-railway-elevated hover:bg-railway-card border border-railway-border hover:border-amber-500/30 rounded-xl p-4 transition-all duration-200">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                              <span className="text-amber-400 text-xs">!</span>
                            </span>
                            <p className="text-sm text-railway-gray group-hover:text-railway-white transition-colors">{aspect}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitor Analysis */}
                {currentAnalysis.competitor_comparison && currentAnalysis.competitor_comparison.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-railway-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      Competitor Analysis
                      <span className="text-xs font-normal text-railway-muted bg-railway-elevated px-2 py-0.5 rounded-full">
                        {currentAnalysis.competitor_comparison.length} insights
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {currentAnalysis.competitor_comparison.map((comparison: string, index: number) => (
                        <div key={index} className="group bg-railway-elevated hover:bg-railway-card border border-railway-border hover:border-primary-500/30 rounded-xl p-4 transition-all duration-200">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center mt-0.5">
                              <span className="text-primary-400 text-xs">{index + 1}</span>
                            </span>
                            <p className="text-sm text-railway-gray group-hover:text-railway-white transition-colors">{comparison}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvement Strategies */}
                {currentAnalysis.improvement_strategies && currentAnalysis.improvement_strategies.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-railway-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      Improvement Strategies
                      <span className="text-xs font-normal text-railway-muted bg-railway-elevated px-2 py-0.5 rounded-full">
                        {currentAnalysis.improvement_strategies.length} strategies
                      </span>
                    </h3>
                    <div className="grid gap-2">
                      {currentAnalysis.improvement_strategies.map((strategy: string, index: number) => (
                        <div key={index} className="group bg-railway-elevated hover:bg-railway-card border border-railway-border hover:border-cyan-500/30 rounded-xl p-4 transition-all duration-200">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center mt-0.5">
                              <svg className="w-3 h-3 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </span>
                            <p className="text-sm text-railway-gray group-hover:text-railway-white transition-colors font-medium">{strategy}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-railway-white">Recent Analyses</h2>
              <span className="text-xs text-railway-muted bg-railway-elevated px-2.5 py-1 rounded-full">
                {analysisHistory.length} total
              </span>
            </div>

            <div className="space-y-3">
              {analysisHistory.map((analysis) => {
                const sentimentConfig = getSentimentConfig(analysis.overall_sentiment);
                return (
                  <div
                    key={analysis.id}
                    className="group bg-railway-elevated hover:bg-railway-card border border-railway-border hover:border-railway-border-hover rounded-xl p-4 transition-all duration-200 cursor-pointer"
                    onClick={() => setCurrentAnalysis(analysis)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Sentiment indicator */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${sentimentConfig.gradient} ${sentimentConfig.border} border flex items-center justify-center`}>
                        <span className={`text-lg font-bold ${sentimentConfig.text}`}>
                          {analysis.status === 'completed' ? analysis.web_presence_score : '-'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-railway-white truncate">{analysis.brand_name}</p>
                          {analysis.status === 'completed' && (
                            <span className={`text-xs font-medium ${sentimentConfig.text} capitalize`}>
                              {analysis.overall_sentiment}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-railway-muted">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(analysis.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {analysis.status === 'completed' && (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Score: {analysis.web_presence_score}/100
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            analysis.status === 'completed' ? 'success' :
                            analysis.status === 'running' ? 'info' :
                            analysis.status === 'failed' ? 'error' : 'default'
                          }
                          size="sm"
                          dot
                        >
                          {analysis.status}
                        </Badge>
                        {analysis.status === 'completed' && (
                          <div className="flex items-center gap-1 text-primary-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>View</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-primary-500/5 border-primary-500/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-primary-400 mb-3">What We Analyze</h3>
          <ul className="text-sm text-railway-gray space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Overall brand sentiment across the web
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Customer reviews and feedback
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Brand reputation and perception
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Competitor positioning
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Areas where competitors outperform
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Actionable strategies to improve sentiment
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
