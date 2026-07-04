import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Scale } from 'lucide-react';
import Button from '../ui/Button';

const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it Works' },
    { href: '#faq', label: 'FAQ' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const isLanding = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                        ? 'bg-bg/80 backdrop-blur-xl border-b border-border'
                        : 'bg-transparent'
                    }`}
            >
                <div className="container-custom flex items-center justify-between h-[72px]">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:shadow-glow transition-shadow duration-300">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-text">
                            Contract<span className="gradient-text">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {isLanding &&
                            navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm text-muted hover:text-text transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-full" />
                                </a>
                            ))}
                        <div className="flex items-center gap-3">
                            <Link to="/login">
                                <Button variant="ghost" size="sm">
                                    Log in
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 text-muted hover:text-text"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-[72px] left-0 right-0 z-40 bg-bg/95 backdrop-blur-xl border-b border-border md:hidden"
                    >
                        <div className="container-custom py-6 space-y-4">
                            {isLanding &&
                                navLinks.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className="block py-2 text-muted hover:text-text transition-colors"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            <div className="pt-4 border-t border-border flex flex-col gap-3">
                                <Link to="/login" className="w-full" onClick={() => setMobileOpen(false)}>
                                    <Button variant="outline" className="w-full justify-center">
                                        Log in
                                    </Button>
                                </Link>
                                <Link to="/register" className="w-full" onClick={() => setMobileOpen(false)}>
                                    <Button className="w-full justify-center">Get Started</Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}