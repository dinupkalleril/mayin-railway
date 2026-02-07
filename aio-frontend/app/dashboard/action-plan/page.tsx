'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useBrand } from '@/context/BrandContext'; // Import useBrand

interface ActionPlan {
  overallAssessment: {
    currentVisibilityScore: number;
    potentialScore: number;
    urgencyLevel: string;
    summary: string;
  };
  strengthsToLeverage: { strength: string; howToLeverage: string }[];
  criticalGaps: { gap: string; impact: string; solution: string }[];
  immediateActions: {
    action: string;
    category: string;
    priority: number;
    effort: string;
    impact: string;
    timeline: string;
    details: string;
    expectedOutcome: string;
  }[];
  shortTermStrategy: {
    timeline: string;
    goals: string[];
    actions: { action: string; category: string; details: string; milestones: string[] }[];
  };
  longTermStrategy: {
    timeline: string;
    goals: string[];
    actions: { action: string; category: string; details: string }[];
  };
  contentPlan: {
    immediateContent: { type: string; topic: string; purpose: string }[];
    ongoingContent: { type: string; frequency: string; topics: string[] }[];
  };
  authorityBuildingPlan: {
    targetPublications: string[];
    targetDirectories: string[];
    partnershipOpportunities: string[];
    socialProofActions: string[];
  };
  technicalChecklist: { item: string; status: string; priority: string }[];
  kpisToTrack: { metric: string; currentValue: string; targetValue: string; timeframe: string }[];
  modelSpecificRecommendations: {
    chatgpt: string[];
    claude: string[];
    gemini: string[];
    perplexity: string[];
  };
}

interface Summary {
  aiVisibilityScore: number | null;
  visibilityScans: any[];
  websiteScan: any;
  sentimentAnalysis: any;
  latestActionPlan: any;
  recommendations: {
    hasVisibilityData: boolean;
    hasWebsiteData: boolean;
    hasSentimentData: boolean;
    suggestedNextStep: { action: string; description: string; path: string };
  };
}

interface ActionPlanHistory {
  id: string;
  brand_id: string;
  brand_name: string;
  created_at: string;
}

export default function ActionPlanPage() {
  const { selectedBrand, loading: brandsLoading, error: brandsError } = useBrand();
  const [userId, setUserId] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [planHistory, setPlanHistory] = useState<ActionPlanHistory[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
    }
  }, []);

  useEffect(() => {
    if (userId && selectedBrand?.id) {
      fetchSummary(userId, selectedBrand.id);
      fetchPlanHistory(userId, selectedBrand.id);
    } else if (userId && !selectedBrand && !brandsLoading) {
        setLoading(false); // No brand selected, but brands loaded
    }
  }, [userId, selectedBrand, brandsLoading]);

  const fetchSummary = async (userId: string, brandId: string) => {
    try {
      const response = await fetch(`/api/action-plan/summary/${userId}?brandId=${brandId}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);

        // If there's a latest action plan, fetch it
        if (data.latestActionPlan?.id) {
          fetchActionPlan(data.latestActionPlan.id);
        } else {
            setActionPlan(null); // Clear previous plan if no latest plan for this brand
        }
      } else {
          setSummary(null);
          setActionPlan(null);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary(null);
      setActionPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanHistory = async (userId: string, brandId: string) => {
    try {
      const response = await fetch(`/api/action-plan/user/${userId}?brandId=${brandId}`);
      if (response.ok) {
        const data = await response.json();
        setPlanHistory(data.actionPlans || []);
      } else {
          setPlanHistory([]);
      }
    } catch (error) {
      console.error('Error fetching plan history:', error);
      setPlanHistory([]);
    }
  };

  const selectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    await fetchActionPlan(planId);
  };

  const fetchActionPlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/action-plan/${planId}`);
      if (response.ok) {
        const data = await response.json();
        // plan_data may be JSON string or already parsed object (PostgreSQL JSONB)
        const planData = data.actionPlan?.plan_data;
        if (planData) {
          setActionPlan(typeof planData === 'string' ? JSON.parse(planData) : planData);
        } else {
            setActionPlan(null);
        }
      } else {
          setActionPlan(null);
      }
    } catch (error) {
      console.error('Error fetching action plan:', error);
      setActionPlan(null);
    }
  };

  const generateActionPlan = async () => {
    if (!selectedBrand) {
      setError('Please select a brand to generate an action plan.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch(
        `/api/action-plan/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, brandName: selectedBrand.brandName, brandId: selectedBrand.id })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate action plan');
      }

      setActionPlan(data.plan);
      setSelectedPlanId(data.actionPlanId);
      fetchSummary(userId, selectedBrand.id); // Refresh summary
      fetchPlanHistory(userId, selectedBrand.id); // Refresh history
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || brandsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-railway-border border-t-primary-500"></div>
      </div>
    );
  }

  if (brandsError) {
    return <div className="text-red-500">Error loading brands: {brandsError}</div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'immediate', label: 'Immediate Actions' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'content', label: 'Content Plan' },
    { id: 'technical', label: 'Technical' },
    { id: 'kpis', label: 'KPIs' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-railway-white">AI Visibility Action Plan</h1>
        <p className="text-railway-gray mt-1">
          Comprehensive strategy to improve your brand's visibility in AI responses
        </p>
      </div>

      {/* Data Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="AI Visibility Score"
          value={summary?.aiVisibilityScore ?? '-'}
          subtitle="Combined score"
          status={summary?.aiVisibilityScore ? (summary.aiVisibilityScore >= 70 ? 'good' : summary.aiVisibilityScore >= 40 ? 'medium' : 'low') : 'none'}
        />
        <SummaryCard
          title="Visibility Scans"
          value={summary?.visibilityScans?.length ?? 0}
          subtitle="AI models tested"
          status={summary?.recommendations?.hasVisibilityData ? 'good' : 'none'}
        />
        <SummaryCard
          title="Website Analysis"
          value={summary?.websiteScan?.score ?? '-'}
          subtitle="AI optimization score"
          status={summary?.recommendations?.hasWebsiteData ? 'good' : 'none'}
        />
        <SummaryCard
          title="Sentiment Score"
          value={summary?.sentimentAnalysis?.webPresenceScore ?? '-'}
          subtitle="Web presence"
          status={summary?.recommendations?.hasSentimentData ? 'good' : 'none'}
        />
      </div>

      {/* Plan History */}
      {planHistory.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-railway-white">Action Plan History for {selectedBrand?.brandName || 'Selected Brand'}</h3>
              <span className="text-xs text-railway-muted">{planHistory.length} plan{planHistory.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {planHistory.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const planDate = new Date(plan.created_at);
                return (
                  <button
                    key={plan.id}
                    onClick={() => selectPlan(plan.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-railway-elevated text-railway-gray hover:text-railway-white hover:bg-railway-card border border-railway-border'
                    }`}
                  >
                    <span className="font-medium">{plan.brand_name}</span>
                    <span className="ml-2 opacity-70">
                      {planDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Action Plan Button */}
      <Card className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-primary-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-railway-white mb-1">
                {actionPlan ? 'Generate New Action Plan' : 'Generate Your Action Plan'}
              </h3>
              <p className="text-railway-gray text-sm">
                {actionPlan
                  ? 'Create a fresh action plan based on your latest scan data.'
                  : "We'll analyze all your scan data and create a personalized strategy to improve your AI visibility."
                }
              </p>
              {!summary?.recommendations?.hasVisibilityData && (
                <p className="text-yellow-400 text-xs mt-2">
                  Tip: Run a visibility scan first for better recommendations
                </p>
              )}
            </div>
            <Button
              onClick={generateActionPlan}
              loading={generating}
              disabled={generating || !selectedBrand}
              size="lg"
            >
              {generating ? 'Generating...' : actionPlan ? 'Generate New Plan' : 'Generate Action Plan'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
              {error}
            </div>
          )}
           {!selectedBrand && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-4 py-3 rounded-lg text-sm mt-4">
                    No brand selected. Please add or select a brand to generate an action plan.
                </div>
            )}
        </CardContent>
      </Card>

      {/* Action Plan Content */}
      {actionPlan && (
        <>
          {/* Overall Assessment */}
          <Card className="bg-gradient-to-br from-railway-elevated to-railway-card border-railway-border">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-railway-white">Overall Assessment</h3>
                    <Badge
                      variant={
                        actionPlan.overallAssessment.urgencyLevel === 'critical' ? 'error' :
                        actionPlan.overallAssessment.urgencyLevel === 'high' ? 'warning' :
                        actionPlan.overallAssessment.urgencyLevel === 'medium' ? 'info' : 'success'
                      }
                    >
                      {actionPlan.overallAssessment.urgencyLevel} priority
                    </Badge>
                  </div>
                  <p className="text-railway-gray">{actionPlan.overallAssessment.summary}</p>
                </div>
                <div className="flex items-center gap-8">
                  <ScoreCircle
                    label="Current"
                    value={actionPlan.overallAssessment.currentVisibilityScore}
                    color="text-railway-gray"
                  />
                  <div className="text-2xl text-railway-muted">→</div>
                  <ScoreCircle
                    label="Potential"
                    value={actionPlan.overallAssessment.potentialScore}
                    color="text-green-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-railway-elevated text-railway-gray hover:text-railway-white hover:bg-railway-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <Card>
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-railway-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      Strengths to Leverage
                    </h4>
                    <div className="space-y-3">
                      {actionPlan.strengthsToLeverage?.map((item, i) => (
                        <div key={i} className="bg-railway-dark rounded-lg p-3">
                          <p className="text-railway-white text-sm font-medium">{item.strength}</p>
                          <p className="text-railway-muted text-xs mt-1">{item.howToLeverage}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Gaps */}
                <Card>
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-railway-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      Critical Gaps to Address
                    </h4>
                    <div className="space-y-3">
                      {actionPlan.criticalGaps?.map((item, i) => (
                        <div key={i} className="bg-railway-dark rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <p className="text-railway-white text-sm font-medium">{item.gap}</p>
                            <Badge variant={item.impact === 'high' ? 'error' : item.impact === 'medium' ? 'warning' : 'default'} size="sm">
                              {item.impact}
                            </Badge>
                          </div>
                          <p className="text-railway-muted text-xs mt-1">{item.solution}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Model-Specific Recommendations */}
                <Card className="lg:col-span-2">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-railway-white mb-4">AI Model-Specific Recommendations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(actionPlan.modelSpecificRecommendations || {}).map(([model, recs]) => (
                        <div key={model} className="bg-railway-dark rounded-lg p-4">
                          <h5 className="font-medium text-railway-white capitalize mb-2">{model}</h5>
                          <ul className="space-y-1">
                            {(recs as string[])?.slice(0, 3).map((rec, i) => (
                              <li key={i} className="text-xs text-railway-gray flex items-start gap-2">
                                <span className="text-primary-400 mt-0.5">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'immediate' && (
              <Card>
                <CardContent className="p-5">
                  <h4 className="font-semibold text-railway-white mb-4">Immediate Actions (Priority Order)</h4>
                  <div className="space-y-4">
                    {actionPlan.immediateActions?.map((action, i) => (
                      <div key={i} className="bg-railway-dark rounded-lg p-4 border-l-4 border-primary-500">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">
                                {action.priority}
                              </span>
                              <h5 className="font-medium text-railway-white">{action.action}</h5>
                            </div>
                            <p className="text-railway-gray text-sm mb-3">{action.details}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="default" size="sm">{action.category}</Badge>
                              <Badge variant={action.impact === 'high' ? 'success' : 'info'} size="sm">
                                {action.impact} impact
                              </Badge>
                              <Badge variant={action.effort === 'low' ? 'success' : action.effort === 'medium' ? 'warning' : 'error'} size="sm">
                                {action.effort} effort
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-railway-muted">Timeline</p>
                            <p className="text-sm text-railway-white">{action.timeline}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-railway-border">
                          <p className="text-xs text-railway-muted">Expected Outcome:</p>
                          <p className="text-sm text-green-400">{action.expectedOutcome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'strategy' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-railway-white mb-1">Short-Term Strategy</h4>
                    <p className="text-railway-muted text-sm mb-4">{actionPlan.shortTermStrategy?.timeline}</p>

                    <div className="mb-4">
                      <p className="text-xs text-railway-muted mb-2">Goals:</p>
                      <ul className="space-y-1">
                        {actionPlan.shortTermStrategy?.goals?.map((goal, i) => (
                          <li key={i} className="text-sm text-railway-gray flex items-start gap-2">
                            <span className="text-green-400">✓</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      {actionPlan.shortTermStrategy?.actions?.map((action, i) => (
                        <div key={i} className="bg-railway-dark rounded-lg p-3">
                          <p className="text-railway-white text-sm font-medium">{action.action}</p>
                          <p className="text-railway-muted text-xs mt-1">{action.details}</p>
                          {action.milestones && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {action.milestones.map((m, j) => (
                                <span key={j} className="text-xs bg-railway-elevated px-2 py-0.5 rounded text-railway-gray">
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-railway-white mb-1">Long-Term Strategy</h4>
                    <p className="text-railway-muted text-sm mb-4">{actionPlan.longTermStrategy?.timeline}</p>

                    <div className="mb-4">
                      <p className="text-xs text-railway-muted mb-2">Goals:</p>
                      <ul className="space-y-1">
                        {actionPlan.longTermStrategy?.goals?.map((goal, i) => (
                          <li key={i} className="text-sm text-railway-gray flex items-start gap-2">
                            <span className="text-blue-400">◎</span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      {actionPlan.longTermStrategy?.actions?.map((action, i) => (
                        <div key={i} className="bg-railway-dark rounded-lg p-3">
                          <p className="text-railway-white text-sm font-medium">{action.action}</p>
                          <p className="text-railway-muted text-xs mt-1">{action.details}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-railway-white mb-4">Immediate Content to Create</h4>
                    <div className="space-y-3">
                      {actionPlan.contentPlan?.immediateContent?.map((item, i) => (
                        <div key={i} className="bg-railway-dark rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="info" size="sm">{item.type}</Badge>
                            <p className="text-railway-white text-sm font-medium">{item.topic}</p>
                          </div>
                          <p className="text-railway-muted text-xs">{item.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-railway-white mb-4">Authority Building Plan</h4>

                    {actionPlan.authorityBuildingPlan?.targetPublications?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-railway-muted mb-2">Target Publications:</p>
                        <div className="flex flex-wrap gap-2">
                          {actionPlan.authorityBuildingPlan.targetPublications.map((pub, i) => (
                            <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                              {pub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {actionPlan.authorityBuildingPlan?.targetDirectories?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-railway-muted mb-2">Directory Listings:</p>
                        <div className="flex flex-wrap gap-2">
                          {actionPlan.authorityBuildingPlan.targetDirectories.map((dir, i) => (
                            <span key={i} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              {dir}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {actionPlan.authorityBuildingPlan?.socialProofActions?.length > 0 && (
                      <div>
                        <p className="text-xs text-railway-muted mb-2">Social Proof Actions:</p>
                        <ul className="space-y-1">
                          {actionPlan.authorityBuildingPlan.socialProofActions.map((action, i) => (
                            <li key={i} className="text-sm text-railway-gray flex items-start gap-2">
                              <span className="text-primary-400">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'technical' && (
              <Card>
                <CardContent className="p-5">
                  <h4 className="font-semibold text-railway-white mb-4">Technical Optimization Checklist</h4>
                  <div className="space-y-2">
                    {actionPlan.technicalChecklist?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-railway-dark rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            item.status === 'complete' ? 'bg-green-500 text-white' :
                            item.status === 'partial' ? 'bg-yellow-500 text-white' :
                            'bg-railway-elevated text-railway-muted'
                          }`}>
                            {item.status === 'complete' ? '✓' : item.status === 'partial' ? '◐' : '○'}
                          </span>
                          <span className="text-railway-white text-sm">{item.item}</span>
                        </div>
                        <Badge
                          variant={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'kpis' && (
              <Card>
                <CardContent className="p-5">
                  <h4 className="font-semibold text-railway-white mb-4">Key Performance Indicators to Track</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-railway-muted">
                          <th className="pb-3 pr-4">Metric</th>
                          <th className="pb-3 pr-4">Current</th>
                          <th className="pb-3 pr-4">Target</th>
                          <th className="pb-3">Timeframe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-railway-border">
                        {actionPlan.kpisToTrack?.map((kpi, i) => (
                          <tr key={i}>
                            <td className="py-3 pr-4 text-railway-white text-sm">{kpi.metric}</td>
                            <td className="py-3 pr-4 text-railway-gray text-sm">{kpi.currentValue}</td>
                            <td className="py-3 pr-4 text-green-400 text-sm font-medium">{kpi.targetValue}</td>
                            <td className="py-3 text-railway-muted text-sm">{kpi.timeframe}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, status }: { title: string; value: string | number; subtitle: string; status: string }) {
  const statusColors = {
    good: 'border-green-500/30 bg-green-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-red-500/30 bg-red-500/5',
    none: 'border-railway-border bg-railway-elevated'
  };

  return (
    <Card className={`${statusColors[status as keyof typeof statusColors]} border`}>
      <CardContent className="p-4">
        <p className="text-xs text-railway-muted mb-1">{title}</p>
        <p className="text-2xl font-bold text-railway-white">{value}</p>
        <p className="text-xs text-railway-gray mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function ScoreCircle({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`w-20 h-20 rounded-full border-4 border-railway-border flex items-center justify-center ${color}`}>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs text-railway-muted mt-2">{label}</p>
    </div>
  );
}
