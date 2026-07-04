import { getDocuments } from './documents';

// TODO: Replace with actual API integration

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return null;
  if (bytes > 1024 * 1024 * 1024) {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
  if (bytes > 1024 * 1024) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }
  return (bytes / 1024).toFixed(1) + ' KB';
}

export async function fetchDashboardStats() {
  const docs = getDocuments();
  const totalBytes = docs.reduce((sum, d) => sum + (d.rawSize || 0), 0);
  return {
    contractsUploaded: docs.length || null,
    documentsIndexed: docs.filter((d) => d.status === 'indexed').length || null,
    storageUsed: formatBytes(totalBytes),
    questionsAsked: null,
  };
}

export async function fetchRecentDocuments() {
  return getDocuments().slice(0, 5);
}

export async function fetchRecentActivity() {
  const docs = getDocuments();
  if (docs.length === 0) return [];

  return docs.slice(0, 10).map((doc) => ({
    id: `activity-${doc.id}`,
    action: `Uploaded ${doc.name}`,
    timestamp: doc.uploadedAt,
  }));
}

export async function fetchApplicationStatus() {
  // TODO: Connect to backend API for real status checks
  const docs = getDocuments();
  return {
    authentication: 'connected',
    documents: docs.length > 0 ? 'ready' : 'connected',
    aiAssistant: 'available',
    database: 'checking',
  };
}
