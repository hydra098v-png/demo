import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  GraduationCap,
  Menu,
  X,
  Bell,
  Search,
  Settings,
} from 'lucide-react';
import type { Page } from '@/types';

interface LayoutProps {
  current: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const navItems: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'students', label: 'Students', icon: <Users className="h-5 w-5" /> },
  { id: 'courses', label: 'Courses', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'subjects', label: 'Subjects', icon: <Library className="h-5 w-5" /> },
];

export function Layout({
  current,
  onNavigate,
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  showSearch,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = navItems.find((n) => n.id === current)?.label ?? 'Dashboard';

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <SidebarContent current={current} onNavigate={handleNav} />
      </aside>

      {/* Sidebar — Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white animate-slide-in-left lg:hidden">
            <div className="absolute right-3 top-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent current={current} onNavigate={handleNav} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur-md lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="text-lg font-bold text-gray-900">{currentLabel}</h1>

          {showSearch && onSearchChange && (
            <div className="relative ml-auto hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder ?? 'Search...'}
                className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:w-72"
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 sm:ml-3">
            <button className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button className="hidden rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 sm:block">
              <Settings className="h-5 w-5" />
            </button>
            <div className="ml-1 flex items-center gap-2.5 border-l border-gray-200 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  current,
  onNavigate,
}: {
  current: Page;
  onNavigate: (page: Page) => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">EduAdmin</p>
          <p className="text-xs text-gray-500">College Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Menu
        </p>
        {navItems.map((item) => {
          const active = current === item.id || (current === 'student-profile' && item.id === 'students');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={active ? 'text-blue-600' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
              {active && <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
          <p className="text-xs font-semibold text-blue-900">Academic Year</p>
          <p className="mt-1 text-sm font-bold text-blue-700">2024 — 2025</p>
          <p className="mt-1 text-xs text-blue-500">Semester in progress</p>
        </div>
      </div>
    </>
  );
}
