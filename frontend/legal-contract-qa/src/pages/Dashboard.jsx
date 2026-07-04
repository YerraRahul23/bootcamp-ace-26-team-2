import { motion } from 'framer-motion';
import { Scale, FileText, Upload, Search, History, Settings } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Dashboard() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen pt-[72px]"
        >
            <div className="container-custom py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                        <p className="text-muted">Welcome back! Upload a contract to get started.</p>
                    </div>
                    <Button icon={Upload}>Upload Contract</Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Contracts', value: '12', icon: FileText, color: 'from-primary to-secondary' },
                        { label: 'Questions Asked', value: '47', icon: Search, color: 'from-accent to-cyan-500' },
                        { label: 'Recent Activity', value: '5', icon: History, color: 'from-green-500 to-emerald-500' },
                        { label: 'Storage Used', value: '45%', icon: Settings, color: 'from-yellow-500 to-orange-500' },
                    ].map((stat) => (
                        <div key={stat.label} className="glass rounded-2xl p-6">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-2xl font-bold text-text">{stat.value}</p>
                            <p className="text-sm text-muted">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Recent Contracts */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-lg font-semibold">Recent Contracts</h2>
                    </div>
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-muted" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No contracts yet</h3>
                        <p className="text-sm text-muted mb-6">Upload your first contract to start analyzing.</p>
                        <Button icon={Upload}>Upload Your First Contract</Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}