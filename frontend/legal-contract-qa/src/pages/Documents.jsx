import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function Documents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-1">Documents</h1>
        <p className="text-muted">Manage your uploaded legal contracts.</p>
      </div>
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted" />
        </div>
        <h3 className="text-lg font-medium mb-2">Documents ready</h3>
        <p className="text-sm text-muted">
          This page will contain document management features.
        </p>
      </div>
    </motion.div>
  );
}
