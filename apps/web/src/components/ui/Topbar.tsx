'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Bell, ChevronDown, LogOut, Settings, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useNotificationCount } from '@/hooks/useNotifications';
import { clsx } from 'clsx';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { data: nbNonLues = 0 } = useNotificationCount();
  const router = useRouter();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const dateNow = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    logout();
    setMenuOuvert(false);
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Gauche : burger mobile + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-surface text-gray-500 hover:text-text-main transition-colors"
        >
          <Menu size={20} />
        </button>
        <Image src="/logo.png" alt="GESTMONEY" width={120} height={40} className="object-contain hidden sm:block" priority />
        <p className="text-xs text-gray-400 hidden md:block capitalize">{dateNow}</p>
      </div>

      {/* Droite */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-xl hover:bg-surface text-gray-500 hover:text-text-main transition-colors"
        >
          <Bell size={20} />
          {nbNonLues > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {nbNonLues > 9 ? '9+' : nbNonLues}
            </span>
          )}
        </Link>

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            onClick={() => setMenuOuvert((v) => !v)}
            className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface transition-colors"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sidebar font-bold text-sm uppercase">
              {user ? user.prenom[0] + user.nom[0] : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-text-main leading-none">
                {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'admin'}</p>
            </div>
            <ChevronDown size={16} className={clsx('text-gray-400 transition-transform', menuOuvert && 'rotate-180')} />
          </button>

          {menuOuvert && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOuvert(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMenuOuvert(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface transition-colors"
                >
                  <User size={16} /> Mon profil
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOuvert(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-surface transition-colors"
                >
                  <Settings size={16} /> Paramètres
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
