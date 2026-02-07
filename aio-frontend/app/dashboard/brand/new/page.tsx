'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';

export default function NewBrandPage() {
  const router = useRouter();
  const { fetchBrands } = useBrand();
  const [userId, setUserId] = useState('');
  const [brandInfo, setBrandInfo] = useState({
    brandName: '',
    tagline: '',
    productDetails: '',
    websiteUrl: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
      setUserId(id);
    } else {
      setMessage({ type: 'error', text: 'User not logged in.' });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      if (!userId) {
        throw new Error('User not identified. Please log in.');
      }

      const response = await fetch(`/api/brand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          brand_name: brandInfo.brandName,
          tagline: brandInfo.tagline,
          product_details: brandInfo.productDetails,
          website_url: brandInfo.websiteUrl,
          location: brandInfo.location,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create new brand');
      }

      setMessage({ type: 'success', text: 'Brand created successfully!' });
      setBrandInfo({
        brandName: '',
        tagline: '',
        productDetails: '',
        websiteUrl: '',
        location: ''
      });
      fetchBrands(); // Refresh brands in context
      router.push('/dashboard/brand'); // Redirect to brand list
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-railway-white">Create New Brand</h1>
        <p className="text-railway-gray mt-1">
          Add a new brand to manage its details and run analyses.
        </p>
      </div>

      {/* Form */}
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Brand Name */}
            <div>
              <label className="block text-sm font-medium text-railway-gray mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={brandInfo.brandName}
                onChange={(e) => setBrandInfo({ ...brandInfo, brandName: e.target.value })}
                placeholder="Enter your brand name"
                className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
              />
              <p className="text-xs text-railway-muted mt-1.5">
                The official name of your brand
              </p>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium text-railway-gray mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={brandInfo.tagline}
                onChange={(e) => setBrandInfo({ ...brandInfo, tagline: e.target.value })}
                placeholder="Your brand's tagline (optional)"
                className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <p className="text-xs text-railway-muted mt-1.5">
                Optional: Your brand's slogan or tagline
              </p>
            </div>

            {/* Product Details */}
            <div>
              <label className="block text-sm font-medium text-railway-gray mb-2">
                Product/Service Category *
              </label>
              <input
                type="text"
                value={brandInfo.productDetails}
                onChange={(e) => setBrandInfo({ ...brandInfo, productDetails: e.target.value })}
                placeholder="e.g., running shoes, cloud storage, marketing software"
                className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
              />
              <p className="text-xs text-railway-muted mt-1.5">
                Describe what your brand offers in 2-4 words
              </p>
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm font-medium text-railway-gray mb-2">
                Website URL *
              </label>
              <input
                type="url"
                value={brandInfo.websiteUrl}
                onChange={(e) => setBrandInfo({ ...brandInfo, websiteUrl: e.target.value })}
                placeholder="https://yourbrand.com"
                className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
              />
              <p className="text-xs text-railway-muted mt-1.5">
                Your official website URL
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-railway-gray mb-2">
                Primary Market/Location *
              </label>
              <input
                type="text"
                value={brandInfo.location}
                onChange={(e) => setBrandInfo({ ...brandInfo, location: e.target.value })}
                placeholder="e.g., United States, India, Europe, Global"
                className="w-full px-4 py-3 bg-railway-dark border border-railway-border rounded-lg text-railway-white placeholder-railway-muted focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
              />
              <p className="text-xs text-railway-muted mt-1.5">
                Your primary target market or geographic focus
              </p>
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
              {saving ? 'Creating...' : 'Create Brand'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
