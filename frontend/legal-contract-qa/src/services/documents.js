// Unified document service with LocalStorage persistence and metadata support
const STORAGE_KEY = 'contractai_documents';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

let idCounter = parseInt(localStorage.getItem('contractai_doc_counter') || '0', 10);

function nextId() {
  idCounter += 1;
  localStorage.setItem('contractai_doc_counter', idCounter.toString());
  return `doc_${idCounter}`;
}

export function validateFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const isAcceptedMime = ACCEPTED_TYPES.includes(file.type);
  const isAcceptedExt = ACCEPTED_EXTENSIONS.includes(ext);

  if (!isAcceptedMime && !isAcceptedExt) {
    return {
      valid: false,
      error: 'Unsupported file type. Only PDF and DOCX files are allowed.',
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

export function getDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocuments(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export async function fetchDocuments() {
  return getDocuments();
}

export async function uploadDocument(file) {
  const docs = getDocuments();
  
  const rawSize = file.size;
  const size = file.size > 1024 * 1024
    ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
    : (file.size / 1024).toFixed(1) + ' KB';

  const doc = {
    id: nextId(),
    name: file.name || `Contract - ${new Date().toLocaleDateString()}`,
    uploadedAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    createdAt: Date.now(),
    status: 'indexed',
    rawSize,
    size,
    url: file ? URL.createObjectURL(file) : '#',
  };

  docs.unshift(doc);
  saveDocuments(docs);
  return doc;
}

export async function deleteDocument(id) {
  let docs = getDocuments();
  const doc = docs.find((d) => d.id === id);
  if (doc?.url && doc.url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(doc.url);
    } catch {
      // Ignore if revoking fails or URL is invalid
    }
  }
  docs = docs.filter((d) => d.id !== id);
  saveDocuments(docs);
  return { success: true };
}

export async function renameDocument(id, name) {
  const docs = getDocuments();
  const updatedDocs = docs.map((doc) =>
    doc.id === id ? { ...doc, name } : doc
  );
  saveDocuments(updatedDocs);
  return { success: true };
}

export function updateDocumentStatus(id, status) {
  const docs = getDocuments();
  const doc = docs.find((d) => d.id === id);
  if (doc) {
    doc.status = status;
    saveDocuments(docs);
  }
  return docs;
}

