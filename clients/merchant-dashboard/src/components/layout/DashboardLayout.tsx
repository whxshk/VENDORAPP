import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PageTransition } from '../ui/page-transition';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <Sidebar />
      <div className="lg:pl-64 min-h-screen transition-all duration-300">
        <TopBar />
        <main className="p-8 max-w-[1920px] mx-auto">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
