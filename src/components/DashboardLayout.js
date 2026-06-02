'use client';

import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  const { user, authError } = useAuth();

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
    </div>
  );
}
