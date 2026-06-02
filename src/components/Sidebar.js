'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NAV_ITEMS } from '@/lib/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Users,
  ShieldCheck,
  LogOut,
  Activity,
  Menu,
  X,
  Sun,
  Moon,
  CalendarDays,
  FolderKanban,
} from 'lucide-react';

const ICON_MAP = {
  dashboard: LayoutDashboard,
  tasks: CheckSquare,
  use_cases: FileText,
  daily_logs: CalendarDays,
  projects: FolderKanban,
  users: Users,
  roles: ShieldCheck,
};
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const { user, profile, role, logout, hasPermission } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  // Khởi tạo và đồng bộ theme từ localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Hàm đổi theme Sáng / Tối
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Menu được xây dựng hoàn toàn từ registry + quyền trong database
  const visibleItems = NAV_ITEMS
    .filter(item => hasPermission(item.resource, 'view'))
    .map(item => ({ ...item, name: item.label, icon: ICON_MAP[item.resource] }));

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      alert('Không thể đăng xuất: ' + error.message);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 dark:bg-gray-950 border-b border-slate-200 dark:border-gray-900 text-slate-800 dark:text-white sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-500" />
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            AeroTask
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-950/80 border-r border-slate-200 dark:border-gray-900 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:sticky md:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top brand logo */}
        <div className="p-6 border-b border-slate-200 dark:border-gray-900 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group select-none">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent group-hover:opacity-90">
                AeroTask
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium tracking-widest uppercase">
                Management
              </p>
            </div>
          </Link>
          
          {/* Theme switcher for Desktop */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex p-2 rounded-xl bg-slate-100 dark:bg-gray-900 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-gray-800 transition-all cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>


        {/* Menu list */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {visibleItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-600 dark:border-indigo-500' 
                    : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-900 hover:text-slate-800 dark:hover:text-white'
                  }
                `}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-gray-400 group-hover:text-slate-800 dark:group-hover:text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-200 dark:border-gray-900 bg-slate-50 dark:bg-gray-950/40">
          <div className="flex items-center gap-2">
            <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-2 flex-1 min-w-0 rounded-xl bg-white dark:bg-gray-900/30 border border-slate-200 dark:border-gray-900/50 hover:bg-slate-50 dark:hover:bg-gray-900/50 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group cursor-pointer">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-10 w-10 rounded-full border border-slate-200 dark:border-gray-800 object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white uppercase shadow-inner shrink-0">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-semibold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {profile?.full_name || 'Đang tải...'}
                </h2>
                <span className={`inline-flex px-1.5 py-0.5 mt-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                  role?.name === 'Admin'
                    ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                    : role?.name === 'Manager'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}>
                  {role?.name || 'Developer'}
                </span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
