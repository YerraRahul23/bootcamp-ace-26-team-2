import { motion } from 'framer-motion';
import { Scale, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="min-h-screen flex pt-[72px]">
            {/* Left - Branding/Illustration */}
            <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                <div className="absolute inset-0 grid-pattern opacity-30" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center max-w-md px-8"
                >
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30">
                        <Scale className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                        AI-Powered{' '}
                        <span className="gradient-text">Contract Analysis</span>
                    </h2>
                    <p className="text-muted leading-relaxed mb-8">
                        Upload legal contracts and get instant answers using advanced AI. Save hours of manual review time.
                    </p>
                    <div className="flex flex-col gap-3 items-center">
                        {['Upload any contract PDF', 'Ask natural language questions', 'Get accurate answers instantly'].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[440px]"
                >
                    <div className="glass rounded-3xl p-8 md:p-10">
                        <div className="text-center mb-8">
                            <Link to="/" className="inline-flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <Scale className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-lg">
                                    Contract<span className="gradient-text">AI</span>
                                </span>
                            </Link>
                            <h1 className="text-2xl font-bold mb-2">{title}</h1>
                            <p className="text-sm text-muted">{subtitle}</p>
                        </div>
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}