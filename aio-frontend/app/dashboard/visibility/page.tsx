'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ScanForm from '@/components/Dashboard/VisibilityScan/ScanForm';
import ScanResults from '@/components/Dashboard/VisibilityScan/ScanResults';
import ScanHistory from '@/components/Dashboard/VisibilityScan/ScanHistory';
import { Card, CardContent } from '@/components/ui/Card';

// Model aliases are now fetched from the backend API
// This ensures model configuration is centralized and can be changed without frontend changes

interface ModelAlias {
  id: string;        // Alias ID like "chatgpt.fast"
  name: string;      // Display name like "OpenAI Fast"
  description: string;
  isDefault?: boolean;
}

interface ProviderConfig {
  displayName: string;
  company: string;
  aliases: ModelAlias[];
}

function VisibilityPageContent() {
  const searchParams = useSearchParams();
  const modelParam = searchParams?.get('model');

  const [userId, setUserId] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(modelParam || 'chatgpt');
  const [selectedModelVersion, setSelectedModelVersion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [modelAliases, setModelAliases] = useState<Record<string, ModelAlias[]>>({});
  const [aliasesLoading, setAliasesLoading] = useState(true);

  // Load user ID from localStorage
  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
    }
  }, []);

  // Fetch model aliases from backend API
  useEffect(() => {
    async function fetchAliases() {
      try {
        const response = await fetch(`/api/model-config/providers`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.providers) {
            // Transform to the format we need
            const transformed: Record<string, ModelAlias[]> = {};
            Object.entries(data.providers).forEach(([key, provider]) => {
              const p = provider as ProviderConfig;
              transformed[key] = p.aliases;
            });
            setModelAliases(transformed);
          }
        }
      } catch (error) {
        console.error('Error fetching model aliases:', error);
        // Aliases will remain empty, UI will show appropriate message
      } finally {
        setAliasesLoading(false);
      }
    }
    fetchAliases();
  }, []);

  // Set default model version when provider changes or aliases load
  useEffect(() => {
    const aliases = modelAliases[selectedProvider];
    if (aliases && aliases.length > 0) {
      // Find default alias or use first one
      const defaultAlias = aliases.find(a => a.isDefault) || aliases[0];
      setSelectedModelVersion(defaultAlias.id);
    }
    setCurrentScanId(null);
  }, [selectedProvider, modelAliases]);

  const handleScanStarted = (scanId: string) => {
    setCurrentScanId(scanId);
    setActiveTab('scan');
  };

  const aiProviders = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      company: 'OpenAI',
      logo: '/ai-logos/openai.svg',
      gradient: 'from-emerald-500/20 to-green-500/10',
      borderColor: 'border-emerald-500/40',
      selectedBorder: 'border-emerald-500',
      glowColor: 'shadow-emerald-500/30',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500'
    },
    {
      id: 'claude',
      name: 'Claude',
      company: 'Anthropic',
      logo: '/ai-logos/anthropic.svg',
      gradient: 'from-orange-500/20 to-amber-500/10',
      borderColor: 'border-orange-500/40',
      selectedBorder: 'border-orange-500',
      glowColor: 'shadow-orange-500/30',
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500'
    },
    {
      id: 'gemini',
      name: 'Gemini',
      company: 'Google',
      logo: '/ai-logos/google.svg',
      gradient: 'from-blue-500/20 to-cyan-500/10',
      borderColor: 'border-blue-500/40',
      selectedBorder: 'border-blue-500',
      glowColor: 'shadow-blue-500/30',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500'
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      company: 'Perplexity AI',
      logo: '/ai-logos/perplexity.svg',
      gradient: 'from-indigo-500/20 to-violet-500/10',
      borderColor: 'border-indigo-500/40',
      selectedBorder: 'border-indigo-500',
      glowColor: 'shadow-indigo-500/30',
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500'
    },
  ];

  const currentProvider = aiProviders.find(p => p.id === selectedProvider);
  const availableVersions = modelAliases[selectedProvider] || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-railway-white">Brand Visibility Scan</h1>
        <p className="text-railway-gray mt-1">
          Test how often your brand is mentioned across AI models
        </p>
      </div>

      {/* AI Provider Selector */}
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-railway-white">Select AI Provider</h2>
            <span className="text-xs text-railway-muted bg-railway-elevated px-2.5 py-1 rounded-full">
              {aiProviders.length} providers available
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {aiProviders.map((provider) => {
              const isSelected = selectedProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`relative group p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-br ${provider.gradient} ${provider.selectedBorder} shadow-lg ${provider.glowColor}`
                      : `bg-railway-elevated border-railway-border hover:border-railway-border-hover hover:bg-railway-card`
                  }`}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-railway-black flex items-center justify-center`}>
                      <div className={`w-3 h-3 rounded-full ${provider.textColor.replace('text-', 'bg-')}`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Logo container */}
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? `bg-railway-dark/50 border ${provider.borderColor}`
                      : 'bg-railway-dark border border-railway-border group-hover:border-railway-border-hover'
                  }`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={provider.logo}
                      alt={provider.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Prevent handler from running again on the same element
                        target.onerror = null;
                        // Safely handle the fallback UI
                        if (target.parentElement) {
                          target.style.display = 'none';
                          target.parentElement.innerHTML = `<span class="text-lg font-bold ${isSelected ? provider.textColor : 'text-railway-gray'}">${provider.name[0]}</span>`;
                        }
                      }}
                    />
                  </div>

                  {/* Provider name */}
                  <div className={`text-sm font-semibold mb-0.5 transition-colors ${
                    isSelected ? provider.textColor : 'text-railway-white group-hover:text-railway-white'
                  }`}>
                    {provider.name}
                  </div>

                  {/* Company name */}
                  <div className={`text-xs transition-colors ${
                    isSelected ? 'text-railway-gray' : 'text-railway-muted'
                  }`}>
                    {provider.company}
                  </div>

                  {/* Hover ring effect */}
                  {!isSelected && (
                    <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-1 ring-railway-border-hover transition-all" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Model Tier Selector */}
      {currentProvider && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${currentProvider.gradient} border ${currentProvider.borderColor}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentProvider.logo}
                    alt={currentProvider.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Prevent handler from running again on the same element
                      target.onerror = null;
                      // Safely handle the fallback UI
                      if (target.parentElement) {
                        target.style.display = 'none';
                        target.parentElement.innerHTML = `<span class="text-sm font-bold ${currentProvider.textColor}">${currentProvider.name[0]}</span>`;
                      }
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-railway-white">Select {currentProvider.name} Tier</h2>
                  <p className="text-xs text-railway-muted">Choose model performance tier</p>
                </div>
              </div>
              {!aliasesLoading && availableVersions.length > 0 && (
                <span className="text-xs text-railway-muted bg-railway-elevated px-2.5 py-1 rounded-full">
                  {availableVersions.length} tiers
                </span>
              )}
            </div>

            {aliasesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-railway-border border-t-primary-500"></div>
                <span className="ml-3 text-railway-muted text-sm">Loading model tiers...</span>
              </div>
            ) : availableVersions.length === 0 ? (
              <div className="text-center py-8 text-railway-muted">
                <p>No model tiers available for this provider.</p>
                <p className="text-xs mt-1">Please check your backend configuration.</p>
              </div>
            ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableVersions.map((version) => {
                const isSelected = selectedModelVersion === version.id;
                return (
                  <button
                    key={version.id}
                    onClick={() => setSelectedModelVersion(version.id)}
                    className={`relative text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? `bg-gradient-to-br ${currentProvider.gradient} ${currentProvider.selectedBorder} border-2`
                        : 'bg-railway-elevated border-railway-border hover:border-railway-border-hover hover:bg-railway-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold mb-1 ${isSelected ? currentProvider.textColor : 'text-railway-white'}`}>
                          {version.name}
                        </div>
                        <div className="text-xs text-railway-muted truncate">
                          {version.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full ${currentProvider.bgColor} flex items-center justify-center`}>
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card className="animate-fade-in">
        <div className="border-b border-railway-border">
          <div className="flex px-6 gap-1">
            <button
              onClick={() => setActiveTab('scan')}
              className={`relative px-5 py-4 font-medium text-sm transition-all ${
                activeTab === 'scan'
                  ? 'text-railway-white'
                  : 'text-railway-muted hover:text-railway-gray'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Scan
              </span>
              {activeTab === 'scan' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`relative px-5 py-4 font-medium text-sm transition-all ${
                activeTab === 'history'
                  ? 'text-railway-white'
                  : 'text-railway-muted hover:text-railway-gray'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scan History
              </span>
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          {activeTab === 'scan' ? (
            <div className="space-y-6">
              <ScanForm
                userId={userId}
                aiModel={selectedProvider}
                modelVersion={selectedModelVersion}
                onScanStarted={handleScanStarted}
              />

              {currentScanId && (
                <div className="mt-6">
                  <ScanResults scanId={currentScanId} />
                </div>
              )}
            </div>
          ) : (
            <ScanHistory key={`${selectedProvider}-${selectedModelVersion}`} userId={userId} aiModel={selectedProvider} modelVersion={selectedModelVersion} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VisibilityPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-railway-border border-t-primary-500 mx-auto"></div>
          <p className="mt-4 text-railway-muted">Loading...</p>
        </div>
      </div>
    }>
      <VisibilityPageContent />
    </Suspense>
  );
}
