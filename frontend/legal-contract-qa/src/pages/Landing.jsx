import { motion } from 'framer-motion';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import WhyChooseUs from '../components/landing/WhyChooseUs';
import Stats from '../components/landing/Stats';
import FAQ from '../components/landing/FAQ';
import CTA from '../components/landing/CTA';

export default function Landing() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Hero />
            <Features />
            <HowItWorks />
            <WhyChooseUs />
            <Stats />
            <FAQ />
            <CTA />
        </motion.div>
    );
}