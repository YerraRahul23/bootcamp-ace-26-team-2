import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, MessageSquare, Clock, Activity } from 'lucide-react';
import Button from '../components/ui/Button';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import DashboardSection from '../components/dashboard/DashboardSection';
import EmptyState from '../components/dashboard/EmptyState';
import {
  fetchDashboardStats,
  fetchRecentDocuments,
  fetchRecentActivity,
} from '../services/dashboard';

function LoadingSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-48 bg-card-hover rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-72 bg-card-hover rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-card-hover animate-pulse mb-4" />
            <div className="h-8 w-16 bg-card-hover rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-32 bg-card-hover rounded-lg animate-pulse" />
          </div>
        ))}
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [statsData, docsData, activityData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentDocuments(),
          fetchRecentActivity(),
        ]);
        if (!mountedRef.current) return;
        setStats(statsData);
        setDocuments(docsData);
        setActivity(activityData);
      } catch {
        // TODO: Handle error state with a retry mechanism
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-1">Dashboard</h1>
          <p className="text-muted">
            {/* TODO: Replace with authenticated user's name when auth context is available */}
            Welcome back!
          </p>
        </div>
        <Button icon={Upload}>Upload Contract</Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <DashboardStatCard
          icon={FileText}
          label="Contracts Uploaded"
          value={stats?.contractsUploaded}
          gradient="from-primary to-secondary"
        />
        <DashboardStatCard
          icon={MessageSquare}
          label="Questions Asked"
          value={stats?.questionsAsked}
          gradient="from-accent to-cyan-500"
        />
        <DashboardStatCard
          icon={Clock}
          label="Recent Uploads"
          value={stats?.recentUploads}
          gradient="from-green-500 to-emerald-500"
        />
      </div>

      {/* Recent Documents */}
      <DashboardSection title="Recent Documents" className="mb-8">
        {documents.length > 0 ? (
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.status === 'indexed'
                        ? 'text-success bg-success/10'
                        : doc.status === 'processing'
                        ? 'text-warning bg-warning/10'
                        : doc.status === 'failed'
                        ? 'text-error bg-error/10'
                        : 'text-muted bg-card-hover'
                    }`}
                  >
                    {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1)}
                  </span>
                  <span className="text-xs text-muted">{doc.uploadedAt}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No contracts uploaded yet"
            description="Upload your first legal contract to begin asking AI-powered questions."
            action={
              <Button variant="outline" icon={Upload}>
                Upload Your First Contract
              </Button>
            }
          />
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
  );
}
