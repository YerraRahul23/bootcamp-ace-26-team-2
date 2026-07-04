import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Brain, Shield, FileText, Zap } from 'lucide-react';

const benefits = [
    { icon: Clock, text: 'Reduce contract review time by up to 80%' },
    { icon: Brain, text: 'AI-powered legal insights and analysis' },
    { icon: CheckCircle2, text: 'Accurate contextual answers every time' },
    { icon: FileText, text: 'Easy document management and organization' },
    { icon: Shield, text: 'Enterprise-grade security and encryption' },
    { icon: Zap, text: 'Lightning-fast processing and responses' },
];

export default function WhyChooseUs() {
    return (
        <section id="why-choose-us" className="py-24 relative">
            <div className="container-custom">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left - Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        className="relative"
                    >
                        <div className="relative w-full max-w-[450px] mx-auto aspect-[4/3]">
                            {/* Background card */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border" />

                            {/* Stats cards */}
                            <motion.div
                                className="absolute top-[10%] left-[5%] glass rounded-2xl p-4 shadow-lg"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-text">1,000+</p>
                                        <p className="text-xs text-muted">Contracts Processed</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute bottom-[15%] right-[5%] glass rounded-2xl p-4 shadow-lg"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-cyan-500 flex items-center justify-center">
                                        <Brain className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-text">95%</p>
                                        <p className="text-xs text-muted">Answer Accuracy</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute bottom-[40%] right-[20%] glass rounded-2xl p-4 shadow-lg"
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-text">{'<5s'}</p>
                                        <p className="text-xs text-muted">Response Time</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Right - Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                            Why choose{' '}
                            <span className="gradient-text">ContractAI</span>
                        </h2>
                        <p className="text-muted text-lg leading-relaxed mb-8">
                            Thousands of legal professionals trust ContractAI to streamline their contract review process. Here's why we're the preferred choice.
                        </p>

                        <div className="space-y-4">
                            {benefits.map((benefit) => (
                                <div key={benefit.text} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <benefit.icon className="w-3.5 h-3.5 text-success" />
                                    </div>
                                    <span className="text-text-secondary">{benefit.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}