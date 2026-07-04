import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, HardDrive, MessageSquare,
  Activity, User, Shield, Cpu, Database,
  Lightbulb, ArrowRight, RefreshCw,
} from 'lucide-react';
import Button from '../components/ui/Button';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import DashboardSection from '../components/dashboard/DashboardSection';
import EmptyState from '../components/dashboard/EmptyState';
import QuickActionCard from '../components/dashboard/QuickActionCard';
import ApplicationStatusCard from '../components/dashboard/ApplicationStatusCard';
import UploadModal from '../components/documents/UploadModal';
import StatusBadge from '../components/documents/StatusBadge';
import {
  fetchDashboardStats,
  fetchRecentDocuments,
  fetchRecentActivity,
  fetchApplicationStatus,
} from '../services/dashboard';
import { fetchProfile } from '../services/profile';

function LoadingSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-48 bg-card-hover rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-72 bg-card-hover rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-card-hover animate-pulse mb-4" />
            <div className="h-8 w-16 bg-card-hover rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-32 bg-card-hover rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      <div className="mb-8">
        <div className="h-6 w-32 bg-card-hover rounded-lg animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-card-hover animate-pulse mb-3" />
              <div className="h-4 w-24 bg-card-hover rounded animate-pulse mb-1" />
              <div className="h-3 w-32 bg-card-hover rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden mb-8">
        <div className="p-6 border-b border-border">
          <div className="h-6 w-40 bg-card-hover rounded-lg animate-pulse" />
        </div>
        <div className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card-hover animate-pulse mx-auto mb-4" />
          <div className="h-5 w-48 bg-card-hover rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-64 bg-card-hover rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-lg font-medium mb-2">Unable to load dashboard</h3>
        <p className="text-sm text-muted mb-6">
          Something went wrong while loading your dashboard. Please try again.
        </p>
        <Button icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

const STAT_CARDS = [
  { key: 'contractsUploaded', label: 'Contracts Uploaded', icon: FileText, gradient: 'from-primary to-secondary' },
  { key: 'documentsIndexed', label: 'Documents Indexed', icon: FileText, gradient: 'from-accent to-cyan-500' },
  { key: 'storageUsed', label: 'Storage Used', icon: HardDrive, gradient: 'from-green-500 to-emerald-500' },
  { key: 'questionsAsked', label: 'Questions Asked', icon: MessageSquare, gradient: 'from-orange-500 to-amber-500' },
];

const QUICK_ACTIONS = [
  { key: 'upload', title: 'Upload Contract', description: 'Add a new legal document', icon: Upload },
  { key: 'documents', title: 'Manage Documents', description: 'View and organize contracts', icon: FileText, to: '/dashboard/documents' },
  { key: 'chat', title: 'Open Chat Assistant', description: 'Ask questions about contracts', icon: MessageSquare, to: '/dashboard/chat' },
  { key: 'profile', title: 'View Profile', description: 'Manage your account settings', icon: User, to: '/dashboard/profile' },
];

const STATUS_ITEMS = [
  { key: 'authentication', label: 'Authentication', icon: Shield },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'aiAssistant', label: 'AI Assistant', icon: Cpu },
  { key: 'database', label: 'Database', icon: Database },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState(null);
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [appStatus, setAppStatus] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const mountedRef = useRef(true);
  const navigate = useNavigate();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, statsData, docsData, activityData, statusData] = await Promise.all([
        fetchProfile(),
        fetchDashboardStats(),
        fetchRecentDocuments(),
        fetchRecentActivity(),
        fetchApplicationStatus(),
      ]);
      if (!mountedRef.current) return;
      setUserName(profileData?.name || null);
      setStats(statsData);
      setDocuments(docsData);
      setActivity(activityData);
      setAppStatus(statusData);
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
    loadDashboard();
    return () => {
      mountedRef.current = false;
    };
  }, [loadDashboard]);

  const handleUploadSuccess = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  const insights = useMemo(() => {
    const list = [];
    const count = stats?.contractsUploaded || 0;
    if (count > 0) {
      list.push(`You've uploaded ${count} contract${count > 1 ? 's' : ''}.`);
      const latest = documents[0];
      if (latest) {
        const today = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
        if (latest.uploadedAt === today) {
          list.push(`You uploaded "${latest.name}" today.`);
        } else {
          list.push(`Your latest upload was "${latest.name}".`);
        }
      }
      const indexed = stats?.documentsIndexed || 0;
      if (indexed > 0) {
        list.push(`You have ${indexed} indexed contract${indexed > 1 ? 's' : ''} ready for analysis.`);
      }
    } else {
      list.push("You haven't uploaded any contracts yet. Upload a legal contract to begin using the AI assistant.");
    }
    return list;
  }, [stats, documents]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={loadDashboard} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Dashboard</h1>
          <p className="text-muted">
            {userName ? `Welcome back, ${userName}` : 'Welcome back!'}
            {' '}Manage your legal contracts and access AI-powered contract analysis.
          </p>
        </div>
        <Button icon={Upload} onClick={() => setUploadOpen(true)}>
          Upload Contract
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {STAT_CARDS.map((card) => (
          <DashboardStatCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={stats?.[card.key]}
            gradient={card.gradient}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.key}
              icon={action.icon}
              title={action.title}
              description={action.description}
              to={action.key !== 'upload' ? action.to : undefined}
              onClick={action.key === 'upload' ? () => setUploadOpen(true) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-8 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text mb-1">Insights</p>
            <ul className="space-y-0.5">
              {insights.map((item, i) => (
                <li key={i} className="text-sm text-muted">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recent Documents */}
      <DashboardSection title="Recent Documents" className="mb-8">
        {documents.length > 0 ? (
          <div>
            <div className="divide-y divide-border">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-muted shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {doc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={doc.status} />
                    <span className="text-xs text-muted hidden sm:inline">{doc.uploadedAt}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border text-center">
              <button
                onClick={() => navigate('/dashboard/documents')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                View All Documents
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No contracts uploaded yet"
            description="Upload your first legal contract to begin asking AI-powered questions."
            action={
              <Button variant="outline" icon={Upload} onClick={() => setUploadOpen(true)}>
                Upload Your First Contract
              </Button>
            }
          />
        )}
      </DashboardSection>

      {/* Application Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <DashboardSection title="Application Status">
          {appStatus ? (
            <div className="divide-y divide-border">
              {STATUS_ITEMS.map((item) => (
                <ApplicationStatusCard
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  status={appStatus[item.key]}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-4">
              Unable to load application status.
            </p>
          )}
        </DashboardSection>

        {/* Recent Activity */}
        <DashboardSection title="Recent Activity">
          {activity.length > 0 ? (
            <div className="divide-y divide-border">
              {activity.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-muted shrink-0" />
                  <span className="text-sm">{item.action}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Your recent actions will appear here."
            />
          )}
        </DashboardSection>
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
