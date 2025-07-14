"use client";
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CodingSimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background-primary)' }}>
      <Navigation />
      <div className="md:ml-64">
        {children}
      </div>
    </div>
  );
} 