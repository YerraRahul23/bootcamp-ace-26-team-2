import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AnimatedBackground from './components/ui/AnimatedBackground';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard = location.pathname === '/dashboard';

  return (
    <>
      <ScrollToTop />
      <AnimatedBackground />

      {!isAuthPage && !isDashboard && <Navbar />}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AnimatePresence>

      {!isAuthPage && !isDashboard && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#0F172A',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}