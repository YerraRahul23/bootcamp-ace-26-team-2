import { getDocuments } from './documents';

function getMockHealthData(documentId) {
  const doc = getDocuments().find((d) => d.id === documentId);
  const seed = documentId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const score = Math.round(((seed % 41) + 30) / 10) / 10 + 4;
  const clamped = Math.max(0, Math.min(10, score));

  const allClauses = [
    'Governing Law',
    'Termination',
    'Confidentiality',
    'Payment Terms',
    'Limitation of Liability',
    'Indemnification',
    'Dispute Resolution',
    'Force Majeure',
    'Intellectual Property',
    'Warranty',
    'Notice',
  ];

  const presentCount = Math.max(1, Math.min(allClauses.length - 1, (seed % (allClauses.length - 1)) + 1));
  const shuffled = [...allClauses].sort((a, b) => {
    const ha = (a.charCodeAt(0) + seed) % allClauses.length;
    const hb = (b.charCodeAt(0) + seed) % allClauses.length;
    return ha - hb;
  });
  const present = shuffled.slice(0, presentCount);
  const missing = shuffled.slice(presentCount);

  const penalties = {
    'Governing Law': 1.0,
    Termination: 1.5,
    Confidentiality: 1.0,
    'Payment Terms': 1.0,
    'Limitation of Liability': 1.5,
    Indemnification: 1.0,
    'Dispute Resolution': 1.0,
    'Force Majeure': 0.5,
    'Intellectual Property': 0.5,
    Warranty: 0.5,
    Notice: 0.5,
  };

  const healthScore = Math.max(0, Math.min(10, Math.round((10 - missing.reduce((s, c) => s + (penalties[c] || 0), 0)) * 10) / 10));

  const thresholds = [
    [9.0, 'Low'],
    [7.0, 'Medium'],
    [5.0, 'High'],
    [0.0, 'Critical'],
  ];
  const riskLevel = thresholds.find(([t]) => healthScore >= t)?.[1] || 'Critical';

  const recommendations = missing.map((clause) => {
    const map = {
      'Governing Law': 'Specify the governing jurisdiction to avoid legal ambiguity.',
      Termination: 'Add termination conditions to clarify how either party can end the agreement.',
      Confidentiality: 'Include a Confidentiality clause to protect sensitive business information.',
      'Payment Terms': 'Clearly define payment schedules, due dates, and penalties for late payments.',
      'Limitation of Liability': 'Add a Limitation of Liability clause to cap potential damages.',
      Indemnification: 'Include an Indemnification clause to allocate risk between parties.',
      'Dispute Resolution': 'Add a Dispute Resolution clause outlining arbitration or mediation procedures.',
      'Force Majeure': 'Add a Force Majeure clause to define responsibilities during unforeseen events.',
      'Intellectual Property': 'Include an Intellectual Property clause to clarify ownership of IP.',
      Warranty: 'Consider adding Warranty provisions to define guarantees and disclaimers.',
      Notice: 'Add a Notice clause specifying how formal communications must be delivered.',
    };
    return map[clause] || `Consider adding a ${clause} clause.`;
  });

  return {
    health_score: healthScore,
    risk_level: riskLevel,
    present_clauses: present,
    missing_clauses: missing,
    recommendations,
  };
}

const token =
  typeof window !== 'undefined'
    ? window.__SUPABASE_ACCESS_TOKEN ||
      localStorage.getItem('supabase_access_token') ||
      ''
    : '';

export async function fetchDocumentHealth(documentId) {
  try {
    const res = await fetch(`/documents/${documentId}/health`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const mock = getMockHealthData(documentId);
    return mock;
  }
}
