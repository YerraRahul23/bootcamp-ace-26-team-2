import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { uploadDocument, validateFile } from '../../services/documents';

const ACCEPT_STRING = '.pdf,.docx';
const MAX_FILES = 3;

export default function UploadModal({ open, onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFiles([]);
      setErrors([]);
      setLoading(false);
    }
  }, [open]);

  const addFiles = (incoming) => {
    const combined = [...files, ...incoming].slice(0, MAX_FILES);
    const newErrors = [];

    for (const file of incoming) {
      if (files.some((f) => f.name === file.name && f.size === file.size)) {
        newErrors.push(`${file.name} is already added.`);
        continue;
      }
      const result = validateFile(file);
      if (!result.valid) {
        newErrors.push(`${file.name}: ${result.error}`);
      }
    }

    if (files.length + incoming.length > MAX_FILES) {
      newErrors.push(`You can upload up to ${MAX_FILES} files at a time.`);
    }

    setErrors(newErrors);
    setFiles(combined);
  };

  const handleSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    addFiles(selected);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer?.files || []);
    if (!dropped.length) return;
    addFiles(dropped);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setErrors([]);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setLoading(true);
    setErrors([]);
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        await uploadDocument(file);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setLoading(false);

    if (successCount > 0) {
      const label = successCount === 1 ? 'contract' : 'contracts';
      toast.success(`${successCount} ${label} uploaded successfully`);
      setFiles([]);
      onSuccess?.();
      onClose();
    }

    if (failCount > 0) {
      setErrors([`${failCount} file${failCount > 1 ? 's' : ''} failed to upload. Please try again.`]);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setFiles([]);
    setErrors([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Upload contracts"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg"
          >
            <div className="glass rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-semibold">Upload Contracts</h2>
                <button
                  onClick={handleClose}
                  className="p-2 text-muted hover:text-text rounded-lg hover:bg-card-hover transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1.5 text-muted hover:text-error rounded-lg hover:bg-error/5 transition-colors shrink-0"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {files.length < MAX_FILES && (
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="w-full py-2 text-sm text-primary font-medium hover:text-primary-hover transition-colors"
                      >
                        + Add more files
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary-light/50 transition-all duration-200"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inputRef.current?.click();
                      }
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-xs text-muted">
                      PDF and DOCX files only, up to {MAX_FILES} files, 50 MB each
                    </p>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT_STRING}
                  multiple
                  className="hidden"
                  onChange={handleSelect}
                />

                {errors.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {errors.map((err, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-3 rounded-xl bg-error/5 border border-error/20"
                      >
                        <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                        <p className="text-sm text-error">{err}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                <Button variant="ghost" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  icon={Upload}
                  loading={loading}
                  disabled={!files.length}
                  onClick={handleUpload}
                >
                  {loading
                    ? 'Uploading...'
                    : `Upload${files.length > 1 ? ` (${files.length})` : ''}`
                  }
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
