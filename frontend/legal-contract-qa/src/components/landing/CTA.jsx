import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export default function CTA() {
    return (
        <section className="py-24 relative">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10 border border-border p-12 md:p-16 text-center"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted mb-6">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span>Get started today</span>
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                            Ready to Analyze Your{' '}
                            <span className="gradient-text">Contracts</span>?
                        </h2>

                        <p className="text-muted text-lg mb-8 max-w-lg mx-auto">
                            Join thousands of legal professionals who use ContractAI to streamline their contract review process. Start free, no credit card required.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/register">
                                <Button size="xl" icon={ArrowRight}>
                                    Start Free
                                </Button>
                            </Link>
                            <a href="#features">
                                <Button variant="outline" size="xl">
                                    Learn More
                                </Button>
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}