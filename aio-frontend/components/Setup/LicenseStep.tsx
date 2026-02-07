'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface LicenseStepProps {
  onComplete: (licenseKey: string) => void;
}

export default function LicenseStep({ onComplete }: LicenseStepProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedKey = licenseKey.trim();

    // Basic sanity check (NOT server validation)
    if (trimmedKey.length < 10) {
      setError('Please enter a valid license key.');
      return;
    }

    // Pass license key to next step (registration)
    onComplete(trimmedKey);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-neutral-100 mb-3">
          Welcome to AI Optimization Tool
        </h2>
        <p className="text-neutral-400 text-lg">
          Enter your license key to activate your installation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="license"
            className="block text-sm font-medium text-neutral-300 mb-2.5"
          >
            License Key
          </label>

          <input
            id="license"
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full px-4 py-3.5 border border-neutral-700 rounded-lg
                       focus:ring-2 focus:ring-neutral-900 focus:border-transparent
                       text-center text-lg tracking-wider font-mono transition-all
                       text-neutral-900"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!licenseKey}
          size="lg"
          className="w-full"
        >
          Continue
        </Button>
      </form>

      <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong className="font-semibold">Note:</strong> You should have received
          your license key via email after purchase. If you can’t find it,
          please check your spam folder or contact support.
        </p>
      </div>
    </div>
  );
}
