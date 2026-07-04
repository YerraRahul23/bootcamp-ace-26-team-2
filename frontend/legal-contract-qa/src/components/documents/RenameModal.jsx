import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

export default function RenameModal({ document, onClose, onConfirm }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (document) {
      setName(document.name);
      setError('');
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [document]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Document name cannot be empty');
      return;
    }
    if (trimmed === document.name) {
      onClose();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(document.id, trimmed);
      toast.success('Document renamed successfully');
      onClose();
    } catch {
      toast.error('Failed to rename document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {document && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Rename document"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <form
              onSubmit={handleSubmit}
              className="glass rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Rename Document</h2>
                    <p className="text-xs text-muted truncate max-w-[280px]">
                      {document.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-muted hover:text-text rounded-lg hover:bg-card-hover transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <label
                  htmlFor="rename-input"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Document Name
                </label>
                <input
                  ref={inputRef}
                  id="rename-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full bg-card border rounded-xl px-4 py-3 text-text placeholder:text-muted-dark outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    error
                      ? 'border-error focus:border-error focus:ring-error/20'
                      : 'border-border'
                  }`}
                />
                {error && (
                  <p className="text-xs text-error mt-2" role="alert">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Save
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
