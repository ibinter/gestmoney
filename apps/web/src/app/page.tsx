'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      // Auto-connexion démo si backend absent
      login({
        id: 'demo-user',
        nom: 'Admin',
        prenom: 'Demo',
        email: 'admin@gestmoney.demo',
        role: 'SUPER_ADMIN',
        actif: true,
        createdAt: new Date().toISOString(),
      }, 'demo-token');
      router.replace('/dashboard');
    }
  }, [isAuthenticated, login, router]);

  return null;
}
