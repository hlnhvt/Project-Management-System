'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { RefreshCw } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, authError } = useAuth();
  const [reloading, setReloading] = useState(false);

  const handleReload = () => {
    setReloading(true);
    window.location.reload();
  };

  // Nếu chưa đăng nhập, để AuthContext lo việc chuyển hướng, không render gì
  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0b0f19] overflow-x-hidden transition-colors duration-300 ${authError ? 'pt-10' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Ambient glowing circles */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/3 dark:bg-indigo-500/5 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/3 dark:bg-violet-500/5 blur-[120px] pointer-events-none -z-10" />
        
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* Reload / reconnect button — fixed top-right */}
      <div className="fixed top-4 right-6 z-40">
        <button
          onClick={handleReload}
          disabled={reloading}
          title="Tải lại trang / Kết nối lại Supabase"
          className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-sm hover:shadow-md text-xs font-medium transition-all cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${reloading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Kết nối lại</span>
        </button>
      </div>

      {/* Floating notification bell — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50">
        <NotificationBell />
      </div>
    </div>
  );
}
