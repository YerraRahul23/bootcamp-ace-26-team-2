import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export default function ChatAssistant() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-1">Chat Assistant</h1>
        <p className="text-muted">Ask questions about your legal contracts.</p>
      </div>
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-muted" />
        </div>
        <h3 className="text-lg font-medium mb-2">Chat ready</h3>
        <p className="text-sm text-muted">
          This page will contain chat functionality.
        </p>
      </div>
    </motion.div>
  );
}
