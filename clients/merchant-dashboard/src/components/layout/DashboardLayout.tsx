import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageTransition } from '../ui/page-transition';

export function DashboardLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-base)', '--topbar-h': '80px' } as React.CSSProperties}>
      <div className="ambient-orb left-[-120px] top-[90px] h-72 w-72 bg-blue-500/20" />
      <div className="ambient-orb ambient-orb--alt right-[-110px] top-[240px] h-80 w-80 bg-cyan-500/12" />
      <div className="ambient-orb bottom-[-120px] left-[30%] h-80 w-80 bg-indigo-500/12" />
      <Sidebar />
      <div className="relative z-10 min-h-screen transition-all duration-300 lg:pl-64">
        <TopBar />
        <main className="max-w-[1920px] animate-reveal-up p-4 sm:p-6 lg:p-8 mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
