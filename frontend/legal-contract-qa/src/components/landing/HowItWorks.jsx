import { motion } from 'framer-motion';
import { Upload, Cpu, Database, Search, MessageSquare } from 'lucide-react';

const steps = [
    { icon: Upload, title: 'Upload Contract', description: 'Drag and drop your legal contract PDF. Our system accepts all standard document formats.', color: 'from-primary to-secondary' },
    { icon: Cpu, title: 'Document Processing', description: 'Advanced OCR extracts text while preserving structure, clauses, and formatting.', color: 'from-secondary to-purple-500' },
    { icon: Database, title: 'Vector Embeddings', description: 'Text is converted into vector embeddings for efficient semantic search and retrieval.', color: 'from-accent to-cyan-500' },
    { icon: Search, title: 'Semantic Retrieval', description: 'When you ask a question, the most relevant contract sections are retrieved using vector similarity.', color: 'from-yellow-500 to-orange-500' },
    { icon: MessageSquare, title: 'LLM Generates Answer', description: 'A large language model synthesizes the retrieved context into a precise, natural language answer.', color: 'from-green-500 to-emerald-500' },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 relative">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        How it <span className="gradient-text">works</span>
                    </h2>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        From document upload to AI-powered answers in five simple steps.
                    </p>
                </motion.div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-secondary opacity-30 hidden md:block" />

                    <div className="space-y-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="relative flex items-start gap-6 md:gap-10"
                            >
                                {/* Step number circle */}
                                <div className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                    <step.icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-3">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-muted-dark">STEP {index + 1}</span>
                                        <span className="text-xs text-muted">/ 05</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-text mb-2">{step.title}</h3>
                                    <p className="text-muted leading-relaxed max-w-xl">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}