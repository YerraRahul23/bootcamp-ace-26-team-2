import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Upload, FileText, Search, Eye, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import EmptyState from '../components/dashboard/EmptyState';
import StatusBadge from '../components/documents/StatusBadge';
import UploadModal from '../components/documents/UploadModal';
import DeleteConfirmDialog from '../components/documents/DeleteConfirmDialog';
import { fetchDocuments, deleteDocument } from '../services/documents';

function LoadingSkeleton() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="h-8 w-36 bg-card-hover rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-56 bg-card-hover rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-44 bg-card-hover rounded-full animate-pulse" />
      </div>

      <div className="h-12 w-full bg-card-hover rounded-xl animate-pulse mb-6" />

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 flex-1 bg-card-hover rounded animate-pulse" />
            ))}
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 border-b border-border last:border-b-0">
            <div className="flex gap-8">
              <div className="h-4 flex-[2] bg-card-hover rounded animate-pulse" />
              <div className="h-4 flex-1 bg-card-hover rounded animate-pulse" />
              <div className="h-4 flex-1 bg-card-hover rounded animate-pulse" />
              <div className="h-4 flex-1 bg-card-hover rounded animate-pulse" />
              <div className="h-4 flex-1 bg-card-hover rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
        <FileText className="w-8 h-8 text-error" />
      </div>
      <h3 className="text-lg font-medium mb-2">Failed to load documents</h3>
      <p className="text-sm text-muted mb-6">
        Something went wrong while fetching your documents. Please try again.
      </p>
      <Button icon={RefreshCw} onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

export default function Documents() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const mountedRef = useRef(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocuments();
      if (!mountedRef.current) return;
      setDocuments(data);
    } catch {
      if (!mountedRef.current) return;
      setError(true);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadDocuments();
    return () => {
      mountedRef.current = false;
    };
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((doc) => doc.name.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch {
      toast.error('Failed to delete document. Please try again.');
    }
  }, []);

  const handleUploadSuccess = useCallback(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleView = useCallback(() => {
    toast.error('Document preview is not yet available.');
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={loadDocuments} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Documents</h1>
          <p className="text-muted">Manage your uploaded legal contracts.</p>
        </div>
        <Button icon={Upload} onClick={() => setUploadOpen(true)}>
          Upload Contract
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents by file name..."
          className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-text placeholder:text-muted-dark transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Documents list */}
      {filteredDocuments.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">
                    File Name
                  </th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">
                    Upload Date
                  </th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">
                    Size
                  </th>
                  <th className="text-right text-xs font-semibold text-muted uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-card-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium truncate">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted">{doc.uploadedAt}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted">{doc.size}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleView}
                          className="p-2 text-muted hover:text-text rounded-lg hover:bg-card-hover transition-colors"
                          aria-label="View document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="p-2 text-muted hover:text-error rounded-lg hover:bg-error/5 transition-colors"
                          aria-label="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted">{doc.size}</p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{doc.uploadedAt}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleView}
                      className="p-2 text-muted hover:text-text rounded-lg hover:bg-card-hover transition-colors"
                      aria-label="View document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="p-2 text-muted hover:text-error rounded-lg hover:bg-error/5 transition-colors"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : documents.length > 0 && searchQuery ? (
        /* No search results */
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium mb-2">No matching documents</h3>
          <p className="text-sm text-muted">
            No documents match your search. Try a different term.
          </p>
        </div>
      ) : (
        /* Empty state */
        <div className="glass rounded-2xl p-12 text-center">
          <EmptyState
            icon={FileText}
            title="No legal contracts uploaded yet"
            description="Upload your first contract to begin analyzing with AI-powered insights."
            action={
              <Button
                variant="outline"
                icon={Upload}
                onClick={() => setUploadOpen(true)}
              >
                Upload Contract
              </Button>
            }
          />
        </div>
      )}

      {/* Modals */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
      <DeleteConfirmDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
