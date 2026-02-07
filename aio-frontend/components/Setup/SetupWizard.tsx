'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LicenseStep from './LicenseStep';
import UserStep from './UserStep';
import APIKeysStep from './APIKeysStep';

type SetupStep = 'license' | 'user' | 'apikeys' | 'complete';

export default function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SetupStep>('license');
  const [setupData, setSetupData] = useState({
    licenseKey: '',
    userId: '',
    username: ''
  });

  const handleLicenseComplete = (licenseKey: string) => {
    setSetupData(prev => ({ ...prev, licenseKey }));
    setCurrentStep('user');
  };

  const handleUserComplete = (userId: string, username: string) => {
    setSetupData(prev => ({ ...prev, userId, username }));
    setCurrentStep('apikeys');
  };

  const handleAPIKeysComplete = () => {
    // Setup complete, redirect to dashboard
    localStorage.setItem('userId', setupData.userId);
    localStorage.setItem('username', setupData.username);
    router.push('/dashboard');
  };

  return (
    <div className="bg-neutral-900 rounded-2xl shadow-lg border border-neutral-800 p-10 max-w-2xl w-full animate-fade-in">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-10">
        <StepIndicator
          number={1}
          label="License"
          active={currentStep === 'license'}
          completed={currentStep !== 'license'}
        />
        <div className="flex-1 h-0.5 bg-neutral-200 mx-3">
          <div
            className={`h-full bg-neutral-900 transition-all duration-500 ${
              currentStep !== 'license' ? 'w-full' : 'w-0'
            }`}
          />
        </div>
        <StepIndicator
          number={2}
          label="Account"
          active={currentStep === 'user'}
          completed={currentStep === 'apikeys' || currentStep === 'complete'}
        />
        <div className="flex-1 h-0.5 bg-neutral-200 mx-3">
          <div
            className={`h-full bg-neutral-900 transition-all duration-500 ${
              currentStep === 'apikeys' || currentStep === 'complete' ? 'w-full' : 'w-0'
            }`}
          />
        </div>
        <StepIndicator
          number={3}
          label="API Keys"
          active={currentStep === 'apikeys'}
          completed={currentStep === 'complete'}
        />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 'license' && (
          <LicenseStep onComplete={handleLicenseComplete} />
        )}
        {currentStep === 'user' && (
          <UserStep
            licenseKey={setupData.licenseKey}
            onComplete={handleUserComplete}
          />
        )}
        {currentStep === 'apikeys' && (
          <APIKeysStep
            userId={setupData.userId}
            onComplete={handleAPIKeysComplete}
          />
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
          active
            ? 'bg-neutral-900 text-white scale-110 shadow-lg'
            : completed
            ? 'bg-green-500 text-white shadow-md'
            : 'bg-neutral-900 text-neutral-400 border-2 border-neutral-800'
        }`}
      >
        {completed ? '✓' : number}
      </div>
      <span className={`text-xs mt-2.5 font-medium ${active ? 'text-neutral-100' : 'text-neutral-400'}`}>
        {label}
      </span>
    </div>
  );
}
