import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Scale, Lightbulb } from 'lucide-react';

const RISK_CONFIG = {
  Low: { color: 'text-success', bg: 'bg-success/10', icon: Shield, label: 'Low Risk' },
  Medium: { color: 'text-warning', bg: 'bg-warning/10', icon: AlertTriangle, label: 'Medium Risk' },
  High: { color: 'text-orange-500', bg: 'bg-orange-50', icon: AlertTriangle, label: 'High Risk' },
  Critical: { color: 'text-error', bg: 'bg-error/10', icon: AlertTriangle, label: 'Critical Risk' },
};

function RiskBadge({ level }) {
  const config = RISK_CONFIG[level] || RISK_CONFIG.Critical;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
    </div>
  );
}

export default function DocumentHealthCard({ document: doc, healthData }) {
  if (!healthData) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-sm text-muted">Loading document health...</p>
      </div>
    );
  }

  const { health_score, risk_level, present_clauses, missing_clauses, recommendations } = healthData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="p-5 space-y-5">

        {/* 📊 Document Health */}
        <div>
          <SectionHeader icon={Shield} title="Document Health" />
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-muted mb-1">Health Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text">{health_score}</span>
                <span className="text-sm text-muted">/ 10</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Risk Level</p>
              <RiskBadge level={risk_level} />
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* 📋 Clause Coverage */}
        <div>
          <SectionHeader icon={Scale} title="Clause Coverage" />

          {present_clauses.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted mb-2">Present</p>
              <div className="flex flex-wrap gap-1.5">
                {present_clauses.map((clause) => (
                  <span
                    key={clause}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-success bg-success/10"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {clause}
                  </span>
                ))}
              </div>
            </div>
          )}

          {missing_clauses.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted mb-2">Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {missing_clauses.map((clause) => (
                  <span
                    key={clause}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-error bg-error/10"
                  >
                    <XCircle className="w-3 h-3" />
                    {clause}
                  </span>
                ))}
              </div>
            </div>
          )}

          {present_clauses.length === 0 && missing_clauses.length === 0 && (
            <p className="text-xs text-muted">No clause data available.</p>
          )}
        </div>

        <div className="border-t border-border" />

        {/* 💡 Recommendations */}
        <div>
          <SectionHeader icon={Lightbulb} title="Recommendations" />
          {recommendations.length > 0 ? (
            <ul className="space-y-1.5">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>No critical clauses are missing. Review the document with legal counsel before execution.</span>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
