'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      // If authenticated, redirect to dashboard
      router.push('/dashboard');
    } else {
      // Otherwise, redirect to sign-in
      router.push('/signin');
    }
  }, [router]);

  return null; // Optionally render a loading spinner
}
