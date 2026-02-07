'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressChart } from '@/components/Dashboard/ProgressChart';

interface LatestScans {
  chatgpt?: any;
  claude?: any;
  gemini?: any;
  perplexity?: any;
}

export default function DashboardPage() {
  const [userId, setUserId] = useState('');
  const [latestScans, setLatestScans] = useState<LatestScans>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
      fetchLatestScans(id);
    } else {
      // No user ID - stop loading
      setLoading(false);
    }
  }, []);

  const fetchLatestScans = async (userId: string) => {
    try {
      const response = await fetch(`/api/visibility/latest/${userId}`);

      if (response.ok) {
        const data = await response.json();
        setLatestScans(data.scans || {});
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const aiModels = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      bgClass: 'bg-slate-800 border border-emerald-500/30',
      borderClass: 'border-emerald-500',
      logo: '/ai-logos/openai.svg'
    },
    {
      id: 'claude',
      name: 'Claude',
      bgClass: 'bg-railway-dark border border-orange-500/30',
      borderClass: 'border-orange-500',
      logo: '/ai-logos/anthropic.svg'
    },
    {
      id: 'gemini',
      name: 'Gemini',
      bgClass: 'bg-railway-dark border border-blue-500/30',
      borderClass: 'border-blue-500',
      logo: '/ai-logos/google.svg'
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      bgClass: 'bg-railway-dark border border-indigo-500/30',
      borderClass: 'border-indigo-500',
      logo: '/ai-logos/perplexity.svg'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-railway-white">Dashboard</h1>
        <p className="text-railway-gray mt-1">
          Track your brand visibility across AI models
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        <StatCard
          title="Total Scans"
          value={Object.keys(latestScans).length}
          subtitle="AI models scanned"
          icon={<ChartIcon />}
          color="primary"
        />
        <StatCard
          title="Average Score"
          value={calculateAverageScore(latestScans)}
          subtitle="visibility score"
          icon={<TrendingIcon />}
          color="success"
        />
        <StatCard
          title="AI Models"
          value={aiModels.length}
          subtitle="available models"
          icon={<BotIcon />}
          color="info"
        />
      </div>

      {/* Visibility Progress Chart */}
      {userId && (
        <div className="animate-fade-in">
          <ProgressChart userId={userId} days={30} />
        </div>
      )}

      {/* AI Models Grid */}
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-railway-white">
            Visibility by AI Model
          </h2>
          <Link
            href="/dashboard/visibility"
            className="text-sm text-railway-gray hover:text-primary-400 transition-colors"
          >
            View all scans
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiModels.map((model) => {
            const scan = latestScans[model.id as keyof LatestScans];

            return (
              <Link
                key={model.id}
                href={`/dashboard/visibility?model=${model.id}`}
                className="block group"
              >
                <Card hover className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg ${model.bgClass} flex items-center justify-center shadow-lg`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={model.logo}
                          alt={model.name}
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      {scan && scan.status === 'completed' && (
                        <div className="text-right">
                          <span className="text-2xl font-bold text-railway-white">
                            {scan.score}
                          </span>
                          <span className="text-sm text-railway-muted">/100</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-semibold text-railway-white mb-1 group-hover:text-primary-400 transition-colors">
                      {model.name}
                    </h3>

                    {scan ? (
                      <div className="space-y-2 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-railway-muted">Prompts</span>
                          <span className="text-railway-gray">{scan.prompt_count}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-railway-muted">Mentions</span>
                          <span className="text-railway-gray">{scan.mentioned_count}</span>
                        </div>
                        <div className="pt-2">
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
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-xs text-railway-muted mb-2">No scans yet</p>
                        <span className="text-xs text-primary-400 group-hover:text-primary-300">
                          Start scan &rarr;
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in">
        <h2 className="text-lg font-semibold text-railway-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ActionCard
            title="Action Plan"
            description="Get personalized AI visibility strategy"
            icon={<ActionPlanIcon />}
            href="/dashboard/action-plan"
            gradient="from-primary-500/20 to-purple-500/20"
          />
          <ActionCard
            title="Website Scan"
            description="Analyze your website for AI optimization"
            icon={<WebsiteIcon />}
            href="/dashboard/website-scan"
            gradient="from-blue-500/20 to-cyan-500/20"
          />
          <ActionCard
            title="Sentiment Analysis"
            description="Check brand sentiment across the web"
            icon={<SentimentIcon />}
            href="/dashboard/sentiment"
            gradient="from-purple-500/20 to-pink-500/20"
          />
          <ActionCard
            title="Brand Info"
            description="Update your brand information"
            icon={<BrandIcon />}
            href="/dashboard/brand"
            gradient="from-green-500/20 to-emerald-500/20"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/20',
    success: 'from-green-500/20 to-green-600/10 border-green-500/20',
    info: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-railway-gray">{title}</p>
            <p className="text-3xl font-bold text-railway-white mt-1">{value}</p>
            <p className="text-xs text-railway-muted mt-1">{subtitle}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-railway-elevated flex items-center justify-center text-railway-gray">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ title, description, icon, href, gradient }: any) {
  return (
    <Link href={href}>
      <Card hover className={`h-full bg-gradient-to-br ${gradient}`}>
        <CardContent className="p-5">
          <div className="w-10 h-10 rounded-lg bg-railway-elevated flex items-center justify-center mb-4 text-railway-white">
            {icon}
          </div>
          <h3 className="font-semibold text-railway-white mb-1">{title}</h3>
          <p className="text-sm text-railway-gray">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function calculateAverageScore(scans: LatestScans) {
  const scores = Object.values(scans)
    .filter(scan => scan && scan.score)
    .map(scan => scan.score);

  if (scores.length === 0) return 0;

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(average);
}

// Icons
function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function SentimentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function ActionPlanIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}
