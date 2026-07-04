import { Link } from 'react-router-dom';
import { Scale, Code2, Globe, AtSign } from 'lucide-react';

const footerLinks = {
    product: [
        { label: 'Features', href: '#features' },
        { label: 'How it Works', href: '#how-it-works' },
        { label: 'Pricing', href: '#' },
        { label: 'FAQ', href: '#faq' },
    ],
    company: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
    ],
    legal: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'GDPR', href: '#' },
    ],
};

export default function Footer() {
    return (
        <footer className="border-t border-border">
            <div className="container-custom py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <Scale className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-text">
                                Contract<span className="gradient-text">AI</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted leading-relaxed max-w-xs">
                            AI-powered legal contract analysis platform. Upload contracts and get instant, accurate answers using advanced RAG technology.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <a href="#" className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-muted hover:text-primary hover:bg-card-hover transition-all" aria-label="Twitter">
                                <AtSign className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-muted hover:text-primary hover:bg-card-hover transition-all" aria-label="GitHub">
                                <Code2 className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-muted hover:text-primary hover:bg-card-hover transition-all" aria-label="LinkedIn">
                                <Globe className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
                                {title}
                            </h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-text-secondary hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
                    <span>&copy; 2026 ContractAI. All rights reserved.</span>
                    <span>Made with care for legal professionals.</span>
                </div>
            </div>
        </footer>
    );
}