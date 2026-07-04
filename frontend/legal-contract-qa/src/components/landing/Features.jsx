import { motion } from 'framer-motion';
import { FileText, Bot, Search, Zap, Shield, Brain } from 'lucide-react';

const features = [
    {
        icon: FileText,
        title: 'Upload PDF Contracts',
        description: 'Drag and drop any legal contract in PDF format. Our system processes documents instantly with advanced OCR and text extraction.',
        color: 'from-primary to-secondary',
    },
    {
        icon: Bot,
        title: 'AI-Powered Q&A',
        description: 'Ask natural language questions about your contracts. Our LLM understands legal context and provides accurate, relevant answers.',
        color: 'from-secondary to-purple-500',
    },
    {
        icon: Search,
        title: 'Semantic Search',
        description: 'Find relevant clauses and provisions using semantic understanding, not just keyword matching. Search across multiple contracts simultaneously.',
        color: 'from-accent to-cyan-500',
    },
    {
        icon: Zap,
        title: 'Instant Responses',
        description: 'Get answers in seconds, not hours. Our optimized RAG pipeline delivers rapid responses without compromising on accuracy.',
        color: 'from-yellow-500 to-orange-500',
    },
    {
        icon: Shield,
        title: 'Secure Processing',
        description: 'Enterprise-grade encryption for all uploaded documents. Your contracts are processed in a secure, isolated environment.',
        color: 'from-green-500 to-emerald-500',
    },
    {
        icon: Brain,
        title: 'Context-Aware Retrieval',
        description: 'Our system understands the full context of your contract, retrieving the most relevant sections to answer your specific questions.',
        color: 'from-pink-500 to-rose-500',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
    return (
        <section id="features" className="py-24 relative">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Everything you need to{' '}
                        <span className="gradient-text">analyze contracts</span>
                    </h2>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        Powerful features to help legal professionals review, analyze, and understand contracts faster than ever before.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {features.map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={cardVariants}
                            whileHover={{ y: -8, transition: { duration: 0.3 } }}
                            className="group relative p-8 rounded-2xl bg-card border border-border hover:border-border-hover transition-all duration-300"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-text mb-3">{feature.title}</h3>
                            <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}