import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
    {
        question: 'What file types are supported?',
        answer: 'We support PDF, DOCX, and TXT file formats. Our system uses advanced OCR to extract text from scanned documents as well. Files up to 100MB are supported on all plans.',
    },
    {
        question: 'How secure are uploaded contracts?',
        answer: 'Enterprise-grade security is our priority. All documents are encrypted at rest using AES-256 and in transit using TLS 1.3. Documents are processed in isolated environments and automatically deleted after 30 days unless you choose to keep them.',
    },
    {
        question: 'How does AI answer questions about my contracts?',
        answer: 'Our system uses Retrieval-Augmented Generation (RAG). When you ask a question, we first retrieve the most relevant sections of your contract using semantic search, then feed that context to a large language model to generate a precise, contextual answer.',
    },
    {
        question: 'Is my data used to train the AI models?',
        answer: 'No. Your contract data is never used to train or improve our AI models. We maintain strict data isolation. Your documents are processed solely to answer your questions and are not shared with any third parties.',
    },
    {
        question: 'Can I upload multiple contracts at once?',
        answer: 'Yes, you can upload multiple contracts simultaneously. Our system processes them in parallel and allows you to ask questions across all your documents at once, making it easy to compare clauses and find relevant information.',
    },
    {
        question: 'What kind of questions can I ask?',
        answer: 'You can ask any question about your contract content, such as "What are the termination clauses?", "When does this agreement expire?", "What are the payment terms?", or "Are there any non-compete provisions?" The system understands legal context and provides accurate answers.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <section id="faq" className="py-24 relative">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Frequently asked{' '}
                        <span className="gradient-text">questions</span>
                    </h2>
                    <p className="text-muted text-lg max-w-2xl mx-auto">
                        Everything you need to know about ContractAI. Can't find what you're looking for? Contact our support team.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="glass rounded-2xl divide-y divide-border overflow-hidden">
                        {faqs.map((faq, index) => (
                            <div key={index} className="px-6">
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between py-5 text-left text-text hover:text-primary transition-colors"
                                    aria-expanded={openIndex === index}
                                >
                                    <span className="font-medium pr-4">{faq.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-muted flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-primary' : ''
                                            }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pb-5 text-sm text-muted leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}