'use client';

import { Fragment, ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrandProvider, useBrand } from "@/context/BrandContext";
import { BrandInfo } from '@/types'; // Assuming BrandInfo is defined here
import LicenseExpiredBanner from '@/components/ui/LicenseExpiredBanner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [licenseExpired, setLicenseExpired] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');

    if (!userId) {
      router.push('/login');
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }
    // Probe license status with a lightweight call
    (async () => {
      try {
        const res = await fetch(`/api/brand/user/${userId}`);
        if (res.status === 403) {
          const data = await res.json().catch(() => ({ error: '' }));
          if ((data?.error || '').toLowerCase().includes('expired')) {
            setLicenseExpired(true);
          } else {
            setLicenseExpired(false);
          }
        } else {
          setLicenseExpired(false);
        }
      } catch {
        // Network/other errors: do not toggle banner
      }
    })();
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    router.push('/login');
  };

  return (
    <BrandProvider>
      <div className="min-h-screen bg-railway-black">
        {/* Top Navigation - Railway style */}
        <nav className="sticky top-0 z-50 border-b border-railway-border bg-railway-black/80 backdrop-blur-xl">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex justify-between items-center h-14">
              {/* Logo & Brand */}
              <div className="flex items-center gap-8">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                  {/* Logo icon */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-railway-white group-hover:text-primary-400 transition-colors">
                    Mayin
                  </span>
                </Link>

                {/* Main navigation tabs */}
                <div className="hidden md:flex items-center gap-1">
                  <NavTab href="/dashboard" exact>Dashboard</NavTab>
                  <NavTab href="/dashboard/visibility">Scans</NavTab>
                  <NavTab href="/dashboard/website-scan">Website</NavTab>
                  <NavTab href="/dashboard/sentiment">Sentiment</NavTab>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-4">
                <BrandSwitcher />
                <span className="text-sm text-railway-muted">
                  {username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-railway-gray hover:text-railway-white transition-colors px-3 py-1.5 rounded-lg hover:bg-railway-elevated"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Layout */}
        <div className="flex max-w-[1400px] mx-auto">
          {/* Sidebar */}
          <aside className="w-60 min-h-[calc(100vh-3.5rem)] border-r border-railway-border px-3 py-6 hidden lg:flex lg:flex-col">
            {/* Navigation */}
            <nav className="space-y-1 flex-1">
              {/* Main section */}
              <div className="mb-6">
                <p className="text-[10px] font-semibold text-railway-muted uppercase tracking-wider px-3 mb-2">
                  Overview
                </p>
                <NavLink href="/dashboard" icon={<DashboardIcon />}>
                  Dashboard
                </NavLink>
                <NavLink href="/dashboard/brand" icon={<BrandIcon />}>
                  Brand Info
                </NavLink>
                <NavLink href="/dashboard/api-keys" icon={<KeyIcon />}>
                  API Keys
                </NavLink>
              </div>

              {/* Features section */}
              <div className="pt-4 border-t border-railway-border">
                <p className="text-[10px] font-semibold text-railway-muted uppercase tracking-wider px-3 mb-2">
                  Features
                </p>
                <NavLink href="/dashboard/visibility" icon={<ScanIcon />}>
                  Visibility Scans
                </NavLink>
                <NavLink href="/dashboard/website-scan" icon={<WebIcon />}>
                  Website Scan
                </NavLink>
                <NavLink href="/dashboard/sentiment" icon={<SentimentIcon />}>
                  Sentiment Analysis
                </NavLink>
              </div>

              {/* Strategy section */}
              <div className="pt-4 border-t border-railway-border">
                <p className="text-[10px] font-semibold text-railway-muted uppercase tracking-wider px-3 mb-2">
                  Strategy
                </p>
                <NavLink href="/dashboard/action-plan" icon={<ActionPlanIcon />}>
                  Action Plan
                </NavLink>
              </div>
            </nav>

            {/* Bottom profile section - fixed at bottom */}
            <div className="mt-auto pt-4">
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-400 text-sm font-medium">
                      {username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-railway-white truncate">
                      {username}
                    </p>
                    <p className="text-xs text-railway-muted">Pro Plan</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 px-8 py-6 animate-fade-in min-h-[calc(100vh-3.5rem)]">
            {licenseExpired && <LicenseExpiredBanner />}
            {children}
          </main>
        </div>
      </div>
    </BrandProvider>
  );
}

// BrandSwitcher Component
function BrandSwitcher() {
  const { brands, selectedBrand, selectBrand, loading, error } = useBrand();

  if (loading) return <span className="text-sm text-railway-muted">Loading Brands...</span>;
  if (error) return <span className="text-sm text-red-500">Error: {error}</span>;
  if (!brands || brands.length === 0) return null; // No brands to display

  return (
    <div className="relative">
      <select
        value={selectedBrand?.id || ""}
        onChange={(e) => selectBrand(e.target.value)}
        className="block appearance-none w-full bg-railway-elevated border border-railway-border text-railway-white py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-railway-elevated hover:border-primary-500 transition-colors cursor-pointer text-sm"
      >
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.brandName}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-railway-white">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
        </svg>
      </div>
    </div>
  );
}

// Navigation tab component (top nav)
function NavTab({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) {
  const pathname = usePathname() || '';
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'text-railway-white bg-railway-elevated'
          : 'text-railway-gray hover:text-railway-white hover:bg-railway-elevated/50'
      }`}
    >
      {children}
    </Link>
  );
}

// Sidebar navigation link component
function NavLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  const pathname = usePathname() || '';
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
        isActive
          ? 'bg-railway-elevated text-railway-white'
          : 'text-railway-gray hover:bg-railway-elevated/50 hover:text-railway-white'
      }`}
    >
      <span className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-railway-muted group-hover:text-railway-gray'}`}>
        {icon}
      </span>
      <span>{children}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
      )}
    </Link>
  );
}

// Icons
function DashboardIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function WebIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function SentimentIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function ActionPlanIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}
