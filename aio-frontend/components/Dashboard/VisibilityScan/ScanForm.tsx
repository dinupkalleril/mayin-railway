'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useBrand } from '@/context/BrandContext'; // Import useBrand

interface ScanFormProps {
  userId: string;
  aiModel: string;
  modelVersion: string;
  onScanStarted: (scanId: string) => void;
}

export default function ScanForm({ userId, aiModel, modelVersion, onScanStarted }: ScanFormProps) {
  const { selectedBrand, loading: brandsLoading, error: brandsError } = useBrand(); // Use selectedBrand from context
  const [promptCount, setPromptCount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!selectedBrand) {
      setError('No brand selected. Please select a brand to start a scan.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/visibility/scan`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            aiModel,
            modelVersion,
            brandInfo: {
              id: selectedBrand.id,
              brandName: selectedBrand.brandName,
              tagline: selectedBrand.tagline,
              productDetails: selectedBrand.productDetails,
              websiteUrl: selectedBrand.websiteUrl,
              location: selectedBrand.location,
            },
            promptCount
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan');
      }

      onScanStarted(data.scanId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Brand Information */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-railway-white text-base">Brand Information</h3>
          <Link
            href="/dashboard/brand"
            className="text-xs px-3 py-1.5 rounded-md border border-railway-border text-railway-gray hover:text-railway-white hover:bg-railway-card transition-colors"
          >
            Manage Brands
          </Link>
        </div>

        {!selectedBrand && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-4 py-3 rounded-lg text-sm">
            No brand selected. Please add or select a brand to start a scan.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-railway-gray mb-2">
              Brand Name *
            </label>
            <input
              type="text"
              value={selectedBrand?.brandName || ''}
              readOnly
              className="w-full px-4 py-2.5 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-railway-gray mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={selectedBrand?.tagline || ''}
              readOnly
              className="w-full px-4 py-2.5 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-railway-gray mb-2">
              Product Details *
            </label>
            <input
              type="text"
              value={selectedBrand?.productDetails || ''}
              readOnly
              placeholder="e.g., running shoes, cloud storage"
              className="w-full px-4 py-2.5 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-railway-gray mb-2">
              Website URL *
            </label>
            <input
              type="url"
              value={selectedBrand?.websiteUrl || ''}
              readOnly
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-railway-gray mb-2">
              Location *
            </label>
            <input
              type="text"
              value={selectedBrand?.location || ''}
              readOnly
              placeholder="e.g., United States, India, Global"
              className="w-full px-4 py-2.5 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              required
            />
          </div>
        </div>
      </div>

      {/* Prompt Count */}
      <div className="bg-railway-elevated rounded-xl p-5 border border-railway-border">
        <div className="flex items-center justify-between mb-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-railway-white">
              Number of Prompts
            </label>
            <p className="text-xs text-railway-muted">More prompts = better accuracy</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-400">
              {promptCount}
            </span>
            <span className="text-sm text-railway-muted">prompts</span>
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="relative py-2">
          {/* Track background */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-railway-dark rounded-full" />

          {/* Progress fill */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-75"
            style={{ width: `${((promptCount - 100) / 900) * 100}%` }}
          />

          {/* Actual input */}
          <input
            type="range"
            min="20"
            max="200"
            step="10"
            value={promptCount}
            onChange={(e) => setPromptCount(parseInt(e.target.value))}
            className="range-slider relative z-10 w-full"
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between px-1 mt-3">
          {[20, 50, 100, 150, 200].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPromptCount(value)}
              className={`text-xs px-2 py-1 rounded-md transition-all ${
                promptCount === value
                  ? 'bg-primary-500/20 text-primary-400 font-medium'
                  : 'text-railway-muted hover:text-railway-gray hover:bg-railway-dark'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-xs text-railway-muted mt-4 pt-3 border-t border-railway-border">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Faster
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            More Accurate
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !selectedBrand}
        loading={isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading ? 'Starting Scan...' : !selectedBrand ? 'Select a Brand to Start' : `Start ${aiModel.charAt(0).toUpperCase() + aiModel.slice(1)} Scan`}
      </Button>

      <p className="text-xs text-railway-muted text-center">
        Estimated time: {Math.max(1, Math.ceil(promptCount / 20))} - {Math.ceil(promptCount / 15)} minutes
      </p>
    </form>
  );
}
