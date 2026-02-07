'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface UserStepProps {
  licenseKey: string;
  onComplete: (userId: string, username: string) => void;
}

export default function UserStep({ licenseKey, onComplete }: UserStepProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          licenseKey,
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        /* ignore */
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to create account');
      }

      if (!data?.user?.id || !data?.user?.username) {
        throw new Error('Unexpected response from server');
      }

      onComplete(data.user.id, data.user.username);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-neutral-100 mb-3">
          Create Your Account
        </h2>
        <p className="text-neutral-400 text-lg">
          This account will be used to access your dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2.5">
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2.5">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-lg"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" disabled={isCreating} className="w-full">
          {isCreating ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}
