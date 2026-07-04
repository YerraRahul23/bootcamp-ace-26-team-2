import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, FileText, Search, Shield } from 'lucide-react';
import Button from '../ui/Button';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const floatingCards = [
    { icon: FileText, label: 'Upload Contract', color: 'from-primary to-secondary', delay: 0 },
    { icon: Search, label: 'Ask Questions', color: 'from-accent to-cyan-500', delay: 0.3 },
    { icon: Shield, label: 'Get Answers', color: 'from-secondary to-purple-500', delay: 0.6 },
];

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-[72px] overflow-hidden">
            <div className="container-custom">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid lg:grid-cols-2 gap-12 items-center"
                >
                    {/* Left Content */}
                    <div className="relative z-10">
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted mb-8">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span>AI-Powered Legal Analysis</span>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                            AI-Powered{' '}
                            <span className="gradient-text">Legal Contract</span>{' '}
                            Analysis
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-lg text-muted leading-relaxed max-w-xl mb-8">
                            Upload legal contracts and instantly ask questions using Retrieval-Augmented Generation (RAG), Large Language Models, and Semantic Search. Save time reviewing lengthy legal documents with accurate, context-aware answers.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                            <Link to="/register">
                                <Button size="xl" icon={ArrowRight}>
                                    Get Started Free
                                </Button>
                            </Link>
                            <a href="#features">
                                <Button variant="outline" size="xl">
                                    Learn More
                                </Button>
                            </a>
                        </motion.div>

                        <motion.div variants={itemVariants} className="flex items-center gap-8 mt-12 pt-8 border-t border-border">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-bg flex items-center justify-center text-[10px] font-bold text-white"
                                    >
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text">Trusted by 1,000+</p>
                                <p className="text-xs text-muted">legal professionals</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Illustration */}
                    <motion.div
                        variants={itemVariants}
                        className="relative hidden lg:flex items-center justify-center"
                    >
                        <div className="relative w-full max-w-[500px] aspect-square">
                            {/* Central AI icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse-slow">
                                    <Sparkles className="w-16 h-16 text-white" />
                                </div>
                            </div>

                            {/* Orbiting rings */}
                            <div className="absolute inset-0 border border-border/30 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }} />
                            <div className="absolute inset-[15%] border border-border/20 rounded-full animate-spin-slow" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />

                            {/* Floating cards */}
                            {floatingCards.map((card, index) => {
                                const angle = (index * 120 - 90) * (Math.PI / 180);
                                const radius = 42;
                                const x = 50 + radius * Math.cos(angle);
                                const y = 50 + radius * Math.sin(angle);

                                return (
                                    <motion.div
                                        key={card.label}
                                        className="absolute glass rounded-xl p-3 flex items-center gap-2 shadow-lg"
                                        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 + card.delay, duration: 0.5 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                                            <card.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-medium text-text whitespace-nowrap">{card.label}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}