'use client';

import { useState } from 'react';

interface APIKeysStepProps {
  userId: string;
  onComplete: () => void;
}

const AI_MODELS = [
  { id: 'chatgpt', name: 'ChatGPT (OpenAI)', required: true },
  { id: 'claude', name: 'Claude (Anthropic)', required: false },
  { id: 'gemini', name: 'Gemini (Google)', required: false },
  { id: 'perplexity', name: 'Perplexity', required: false },
  { id: 'grok', name: 'Grok (xAI)', required: false },
];

export default function APIKeysStep({ userId, onComplete }: APIKeysStepProps) {
  const [apiKeys, setAPIKeys] = useState<Record<string, string>>({
    chatgpt: '',
    claude: '',
    gemini: '',
    perplexity: '',
    grok: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if at least ChatGPT key is provided
    if (!apiKeys.chatgpt) {
      setError('ChatGPT API key is required to use the tool');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, apiKeys })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API keys');
      }

      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    // Skip API keys setup (can add later)
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-neutral-100 mb-2">
          Configure AI Model API Keys
        </h2>
        <p className="text-neutral-400">
          Add your API keys to enable brand visibility testing across different AI models
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {AI_MODELS.map((model) => (
          <div key={model.id} className="space-y-2">
            <label className="block text-sm font-medium text-neutral-300">
              {model.name}
              {model.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type={showKeys[model.id] ? 'text' : 'password'}
                value={apiKeys[model.id]}
                onChange={(e) => setAPIKeys({ ...apiKeys, [model.id]: e.target.value })}
                placeholder={`Enter your ${model.name} API key`}
                className="w-full px-4 py-2 border border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 bg-neutral-800 text-neutral-100"
                required={model.required}
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, [model.id]: !showKeys[model.id] })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
              >
                {showKeys[model.id] ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 bg-neutral-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
          >
            Skip for Now
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-neutral-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-neutral-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Where to get API keys:</strong>
          </p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4">
            <li>• ChatGPT: platform.openai.com/api-keys</li>
            <li>• Claude: console.anthropic.com</li>
            <li>• Gemini: makersuite.google.com/app/apikey</li>
            <li>• Perplexity: perplexity.ai/settings/api</li>
            <li>• Grok: x.ai/api</li>
          </ul>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <strong>Security:</strong> Your API keys are encrypted and stored securely in your private database.
          </p>
        </div>
      </div>
    </div>
  );
}
