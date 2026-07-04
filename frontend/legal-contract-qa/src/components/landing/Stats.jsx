import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Percent, Clock, Activity } from 'lucide-react';

const stats = [
    { icon: FileText, value: 1000, suffix: '+', label: 'Contracts Processed', color: 'from-primary to-secondary' },
    { icon: Percent, value: 95, suffix: '%', label: 'Answer Accuracy', color: 'from-accent to-cyan-500' },
    { icon: Clock, value: 5, prefix: '<', suffix: ' sec', label: 'Average Response Time', color: 'from-green-500 to-emerald-500' },
    { icon: Activity, value: 247, suffix: '', label: 'Availability', color: 'from-yellow-500 to-orange-500' },
];

function Counter({ value, prefix = '', suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    useEffect(() => {
        if (!isInView) return;

        let startTime;
        let animationId;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));

            if (progress < 1) {
                animationId = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [isInView, value, duration]);

    return (
        <span ref={ref} className="text-3xl sm:text-4xl font-bold text-text">
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}

export default function Stats() {
    return (
        <section className="py-24 relative">
            <div className="container-custom">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="text-center"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                                <stat.icon className="w-7 h-7 text-white" />
                            </div>
                            <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                            <p className="text-sm text-muted mt-2">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}