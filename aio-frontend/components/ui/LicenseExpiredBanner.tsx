'use client';

import { Button } from '@/components/ui/Button';

interface Props {
  purchaseUrl?: string;
}

export default function LicenseExpiredBanner({
  purchaseUrl = 'https://buy.stripe.com/7sY6oJ4as12dbkB7cC4gg01',
}: Props) {
  return (
    <div className="rounded-xl border border-railway-border bg-railway-card p-4 md:p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-6 h-6 rounded-md bg-yellow-500/15 text-yellow-300 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.69A1.5 1.5 0 003.08 21h17.84a1.5 1.5 0 001.27-2.45L13.71 3.86a1.5 1.5 0 00-2.42 0z" />
            </svg>
          </div>
          <div>
            <p className="text-railway-white font-medium">
              Your trial has ended. To continue running new analyses, add a license key.
            </p>
          </div>
        </div>

        <a href={purchaseUrl} target="_blank" rel="noopener noreferrer" className="self-start md:self-auto">
          <Button variant="accent" size="md" className="px-5">
            Get full license
          </Button>
        </a>
      </div>
    </div>
  );
}

