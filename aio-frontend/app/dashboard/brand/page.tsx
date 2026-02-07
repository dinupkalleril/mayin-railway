'use client';

import { useBrand } from '@/context/BrandContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function BrandPage() {
  const { brands, loading, error, fetchBrands } = useBrand();
  const router = useRouter();
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);

  const handleDeleteBrand = async (brandId: string) => {
    setDeletingBrandId(brandId);
    try {
      const response = await fetch(
        `/api/brand/${brandId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete brand');
      }

      await fetchBrands(); // Refresh the brand list
    } catch (err: any) {
      console.error('Error deleting brand:', err);
      // Optionally show an error message to the user
    } finally {
      setDeletingBrandId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="animate-slide-up flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-railway-white">Your Brands</h1>
          <p className="text-railway-gray mt-1">
            Manage your brand details for visibility scans and other features.
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/brand/new')} size="lg">
          Add New Brand
        </Button>
      </div>

      {/* Brand List */}
      {brands.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="p-6 text-center text-railway-gray">
            <p className="mb-4">You haven't added any brands yet.</p>
            <Button onClick={() => router.push('/dashboard/brand/new')}>
              Add Your First Brand
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <Card key={brand.id} className="animate-fade-in">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-railway-white">
                  {brand.brandName}
                </h3>
                {brand.tagline && (
                  <p className="text-sm text-railway-muted">{brand.tagline}</p>
                )}
                <p className="text-railway-gray">
                  <strong>Product:</strong> {brand.productDetails}
                </p>
                <p className="text-railway-gray">
                  <strong>Website:</strong>{' '}
                  <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                    {brand.websiteUrl}
                  </a>
                </p>
                <p className="text-railway-gray">
                  <strong>Location:</strong> {brand.location}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/dashboard/brand/${brand.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteBrand(brand.id)}
                    disabled={deletingBrandId === brand.id}
                  >
                    {deletingBrandId === brand.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-primary-500/5 border-primary-500/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-primary-400 mb-3">How this is used</h3>
          <ul className="text-sm text-railway-gray space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Your brand information is used to generate relevant test prompts
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              The AI models will be asked questions about products/services in your category
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              We'll track how often your brand appears in the answers
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
              Location helps generate region-specific queries
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
