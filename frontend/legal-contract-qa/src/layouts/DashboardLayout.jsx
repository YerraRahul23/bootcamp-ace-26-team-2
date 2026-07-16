import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Scale } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="h-screen overflow-hidden bg-surface flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 lg:ml-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-xl border-b border-border lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-text">
                Contract<span className="gradient-text">AI</span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-muted hover:text-text rounded-lg hover:bg-card-hover transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}

          className="flex-1 flex flex-col min-h-0 p-6 lg:p-8"
=======
          className="flex flex-col flex-1 p-6 lg:p-8 min-h-0"

          className="flex flex-col flex-1 p-6 lg:p-8 min-h-0 overflow-y-auto"


        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}