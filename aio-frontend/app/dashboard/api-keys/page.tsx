'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const AI_MODELS = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    company: 'OpenAI',
    logo: '/ai-logos/openai.svg',
    gradient: 'from-emerald-500/20 to-green-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    link: 'https://platform.openai.com/api-keys',
    required: true
  },
  {
    id: 'claude',
    name: 'Claude',
    company: 'Anthropic',
    logo: '/ai-logos/anthropic.svg',
    gradient: 'from-orange-500/20 to-amber-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    link: 'https://console.anthropic.com',
    required: false
  },
  {
    id: 'gemini',
    name: 'Gemini',
    company: 'Google',
    logo: '/ai-logos/google.svg',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    link: 'https://makersuite.google.com/app/apikey',
    required: false
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    company: 'Perplexity AI',
    logo: '/ai-logos/perplexity.svg',
    gradient: 'from-indigo-500/20 to-violet-500/10',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-400',
    link: 'https://www.perplexity.ai/settings/api',
    required: false
  },
];

export default function APIKeysPage() {
  const [userId, setUserId] = useState('');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    chatgpt: '',
    claude: '',
    gemini: '',
    perplexity: ''
  });
  const [hasKeys, setHasKeys] = useState<Record<string, boolean>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
      loadAPIKeys(id);
    } else {
      // No user ID - stop loading
      setLoading(false);
    }
  }, []);

  const loadAPIKeys = async (userId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${userId}`);

      if (response.ok) {
        const data = await response.json();
        setHasKeys(data.hasKeys || {});
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    // Only send keys that have been entered
    const keysToSave: Record<string, string> = {};
    Object.keys(apiKeys).forEach(key => {
      if (apiKeys[key]) {
        keysToSave[key] = apiKeys[key];
      }
    });

    try {
      const response = await fetch(
        `/api/api-keys`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            apiKeys: keysToSave
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API keys');
      }

      setMessage({ type: 'success', text: 'API keys saved successfully!' });

      // Reload to get updated status
      await loadAPIKeys(userId);

      // Clear only the fields that were just saved
      const clearedKeys = { ...apiKeys };
      Object.keys(clearedKeys).forEach(key => {
        if (clearedKeys[key]) {
          clearedKeys[key] = '';
        }
      });
      setApiKeys(clearedKeys);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-railway-white">API Keys Management</h1>
        <p className="text-railway-gray mt-1">
          Configure your AI model API keys to enable visibility scanning
        </p>
      </div>

      {/* Current Status */}
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-railway-white">Current Status</h2>
            <span className="text-xs text-railway-muted">
              {Object.values(hasKeys).filter(Boolean).length} of {AI_MODELS.length} configured
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {AI_MODELS.map((model) => {
              const isConfigured = hasKeys[model.id];
              return (
                <div
                  key={model.id}
                  className={`relative group bg-railway-elevated border rounded-xl p-4 text-center transition-all duration-300 hover:bg-railway-card ${
                    isConfigured
                      ? `border-green-500/30 hover:border-green-500/50`
                      : `border-railway-border hover:border-railway-border-hover`
                  }`}
                >
                  {/* Status indicator dot */}
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                    isConfigured
                      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                      : 'bg-railway-muted'
                  }`} />

                  {/* Logo container */}
                  <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                    isConfigured
                      ? `bg-gradient-to-br ${model.gradient} border ${model.borderColor}`
                      : 'bg-railway-dark border border-railway-border'
                  }`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={model.logo}
                      alt={model.name}
                      className={`w-8 h-8 object-contain transition-opacity ${isConfigured ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<span class="text-xl font-bold ${isConfigured ? model.textColor : 'text-railway-muted'}">${model.name[0]}</span>`;
                      }}
                    />
                  </div>

                  {/* Model name */}
                  <div className={`text-sm font-semibold mb-0.5 ${
                    isConfigured ? 'text-railway-white' : 'text-railway-gray'
                  }`}>
                    {model.name}
                  </div>

                  {/* Company name */}
                  <div className="text-xs text-railway-muted mb-3">
                    {model.company}
                  </div>

                  {/* Status badge */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    isConfigured
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-railway-dark text-railway-muted'
                  }`}>
                    {isConfigured ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Configured
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Not Set
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-railway-white mb-5">Configure API Keys</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {AI_MODELS.map((model) => (
                <div key={model.id} className="bg-railway-elevated border border-railway-border rounded-xl p-4 transition-all hover:border-railway-border-hover">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-3 text-sm font-medium text-railway-white">
                      {/* Logo */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${model.gradient} border ${model.borderColor}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={model.logo}
                          alt={model.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<span class="text-sm font-bold ${model.textColor}">${model.name[0]}</span>`;
                          }}
                        />
                      </div>
                      <div>
                        <span className="block">{model.name}</span>
                        <span className="text-xs text-railway-muted font-normal">{model.company}</span>
                      </div>
                      {model.required && (
                        <span className="text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                      )}
                    </label>
                    <a
                      href={model.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-railway-muted hover:text-primary-400 transition-colors"
                    >
                      Get API Key
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showKeys[model.id] ? 'text' : 'password'}
                      value={apiKeys[model.id]}
                      onChange={(e) => setApiKeys({ ...apiKeys, [model.id]: e.target.value })}
                      placeholder={hasKeys[model.id] ? '••••••••••••••••••••' : `Enter your ${model.name} API key`}
                      className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 pr-12 transition-all"
                      required={model.required && !hasKeys[model.id]}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys({ ...showKeys, [model.id]: !showKeys[model.id] })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-railway-muted hover:text-railway-white transition-colors p-1"
                    >
                      {showKeys[model.id] ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {hasKeys[model.id] && !apiKeys[model.id] && (
                    <p className="flex items-center gap-1.5 text-xs text-green-400 mt-2">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Already configured. Leave blank to keep existing key.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`px-4 py-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={saving}
              loading={saving}
              size="lg"
              className="w-full"
            >
              {saving ? 'Saving...' : 'Update API Keys'}
            </Button>
          </form>
        </CardContent>
      </Card>


      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-400 mb-2">Security</h3>
            <p className="text-sm text-railway-gray leading-relaxed">
              Your API keys are encrypted and stored securely in your private database.
              Only you have access to them.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-green-400 mb-2">Cost Control</h3>
            <p className="text-sm text-railway-gray leading-relaxed">
              You're using your own API keys, so you have complete control over usage and costs.
              Monitor your usage in each provider's dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
