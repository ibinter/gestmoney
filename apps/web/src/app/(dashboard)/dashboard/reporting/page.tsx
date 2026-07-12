'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportingRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/rapports'); }, [router]);
  return null;
}
