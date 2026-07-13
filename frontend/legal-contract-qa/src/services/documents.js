import { supabase } from '../utils/supabase';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/x-pdf',
];

const ACCEPTED_EXTENSIONS = ['.pdf'];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

let _documentsCache = [];

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getDocuments() {
  return _documentsCache;
}

export function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const isAcceptedMime = ACCEPTED_TYPES.includes(file.type);
  const isAcceptedExt = ACCEPTED_EXTENSIONS.includes(ext);

  if (!isAcceptedMime && !isAcceptedExt) {
    return {
      valid: false,
      error: 'Unsupported file type. Only PDF files are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File is too large. Maximum size is 50 MB.',
    };
  }

  return { valid: true, error: null };
}

export async function fetchDocuments() {
  const headers = await getAuthHeaders();
  const response = await fetch('/documents', { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }

  const data = await response.json();

  const mapped = data.map((doc) => ({
    id: doc.id,
    documentId: doc.document_id,
    name: doc.filename,
    uploadedAt: new Date(doc.uploaded_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    createdAt: new Date(doc.uploaded_at).getTime(),
    status: doc.indexed ? 'indexed' : 'processing',
    rawSize: doc.file_size,
    size:
      doc.file_size > 1024 * 1024
        ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB'
        : (doc.file_size / 1024).toFixed(1) + ' KB',
    chunks: 0,
    embeddings: 0,
  }));
  _documentsCache = mapped;
  return mapped;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = await getAuthHeaders();
  const response = await fetch('/upload', {
    method: 'POST',
    headers: { ...headers },
    body: formData,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || `Upload failed (HTTP ${response.status})`);
  }

  return response.json();
}

export async function deleteDocument(id) {
  const headers = await getAuthHeaders();
  const response = await fetch(`/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok && response.status !== 404) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.detail || `Delete failed (HTTP ${response.status})`);
  }

  return { success: true };
}

export async function renameDocument(id, name) {
  return { success: true };
}
