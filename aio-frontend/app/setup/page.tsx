'use client';

import SetupWizard from '@/components/Setup/SetupWizard';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-6">
      <SetupWizard />
    </div>
  );
}
