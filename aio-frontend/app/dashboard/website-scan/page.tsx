'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function WebsiteScanPage() {
  const [userId, setUserId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentScan, setCurrentScan] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
      loadScanHistory(id);
    }
  }, []);

  useEffect(() => {
    if (currentScan && (currentScan.status === 'pending' || currentScan.status === 'running')) {
      const interval = setInterval(() => {
        fetchScanStatus(currentScan.id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [currentScan]);

  const loadScanHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/website-scan/scans/${userId}?limit=5`);

      if (response.ok) {
        const data = await response.json();
        setScanHistory(data.scans || []);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  const fetchScanStatus = async (scanId: string) => {
    try {
      const response = await fetch(`/api/website-scan/scan/${scanId}`);

      if (response.ok) {
        const data = await response.json();
        setCurrentScan(data.scan);

        if (data.scan.status === 'completed' || data.scan.status === 'failed') {
          loadScanHistory(userId);
        }
      }
    } catch (error) {
      console.error('Error fetching scan status:', error);
    }
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsScanning(true);

    try {
      const response = await fetch(
        `/api/website-scan/scan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, websiteUrl })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan');
      }

      setCurrentScan({ id: data.scanId, status: 'pending' });
      setWebsiteUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-railway-white">Website Scan</h1>
        <p className="text-railway-gray mt-1">
          Analyze your website for AI optimization opportunities
        </p>
      </div>

      {/* Scan Form */}
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-railway-white mb-4">Start New Scan</h2>

          <form onSubmit={handleStartScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-railway-gray mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isScanning}
              loading={isScanning}
              className="w-full"
              size="lg"
            >
              {isScanning ? 'Starting Scan...' : 'Analyze Website'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Scan Results */}
      {currentScan && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-railway-white mb-4">Scan Results</h2>

            {(currentScan.status === 'pending' || currentScan.status === 'running') && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-400">Analyzing Website...</h3>
                    <p className="text-sm text-blue-300/80">
                      This may take 30-60 seconds
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentScan.status === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-red-400 mb-2">Scan Failed</h3>
                <p className="text-sm text-red-300/80">
                  {currentScan.error_message || 'Unknown error occurred'}
                </p>
              </div>
            )}

            {currentScan.status === 'completed' && (
              <div className="space-y-6">
                {/* Score Card */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 shadow-lg shadow-primary-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">AI Optimization Score</h2>
                      <p className="text-primary-200">
                        {currentScan.is_ai_friendly
                          ? 'Your website is AI-friendly'
                          : 'Improvements needed for better AI visibility'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-bold text-white">
                        {currentScan.score}
                      </span>
                      <span className="text-2xl text-primary-200">/100</span>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {currentScan.issues && currentScan.issues.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-railway-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Issues Found
                    </h3>
                    <div className="space-y-2">
                      {currentScan.issues.map((issue: string, index: number) => (
                        <div key={index} className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                          <p className="text-sm text-red-300">{issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {currentScan.suggestions && currentScan.suggestions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-railway-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                      Recommendations
                    </h3>
                    <div className="space-y-2">
                      {currentScan.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                          <p className="text-sm text-primary-300">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Content */}
                {currentScan.recommended_content && (
                  <div>
                    <h3 className="font-semibold text-railway-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Recommended Content
                    </h3>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <p className="text-sm text-green-300 whitespace-pre-wrap">
                        {currentScan.recommended_content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-railway-white mb-4">Recent Scans</h2>

            <div className="space-y-3">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-railway-elevated border border-railway-border rounded-lg p-4 hover:border-railway-border-hover transition-all cursor-pointer"
                  onClick={() => setCurrentScan(scan)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-railway-white mb-1 truncate">{scan.website_url}</p>
                      <div className="flex items-center gap-4 text-sm text-railway-muted">
                        <span>{new Date(scan.created_at).toLocaleDateString()}</span>
                        {scan.status === 'completed' && (
                          <span className="font-medium text-railway-gray">Score: {scan.score}/100</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          scan.status === 'completed' ? 'success' :
                          scan.status === 'running' ? 'info' :
                          scan.status === 'failed' ? 'error' : 'default'
                        }
                        size="sm"
                        dot
                      >
                        {scan.status}
                      </Badge>
                      {scan.status === 'completed' && (
                        <span className="text-primary-400 text-sm">View</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
              Clear value propositions and brand messaging
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Structured content with proper headings and sections
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Entity mentions (company name, products, services)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              FAQ sections and helpful content
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Trust signals (testimonials, case studies, reviews)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Technical SEO (meta descriptions, schema markup)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
