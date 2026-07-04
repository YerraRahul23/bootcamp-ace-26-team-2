import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock, Mail, User, Calendar, Clock, LogOut, Shield, RefreshCw,
  BadgeCheck, Fingerprint, Trash2, AlertTriangle,
  FileText, MessageSquare, ListTodo,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DashboardSection from '../components/dashboard/DashboardSection';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import ProfileCard from '../components/profile/ProfileCard';
import { fetchProfile, fetchProfileStats, changePassword, deleteAccount } from '../services/profile';

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="h-8 w-32 bg-card-hover rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-64 bg-card-hover rounded-lg animate-pulse" />
      </div>
      <div className="w-80 mx-auto mb-8">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-card-hover animate-pulse mx-auto mb-4" />
          <div className="h-6 w-40 bg-card-hover rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-56 bg-card-hover rounded-lg animate-pulse mx-auto" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="h-6 w-36 bg-card-hover rounded-lg animate-pulse" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-24 bg-card-hover rounded animate-pulse" />
                  <div className="h-4 w-32 bg-card-hover rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="glass rounded-2xl p-12 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
        <User className="w-8 h-8 text-error" />
      </div>
      <h3 className="text-lg font-medium mb-2">Unable to load your account information</h3>
      <p className="text-sm text-muted mb-6">
        Something went wrong while fetching your profile. Please try again.
      </p>
      <Button icon={RefreshCw} onClick={onRetry}>
        Try Again
      </Button>
    </div>
  );
}

const PERSONAL_FIELDS = [
  { key: 'name', label: 'Full Name', icon: User },
  { key: 'email', label: 'Email', icon: Mail },
];

const ACCOUNT_FIELDS = [
  { key: 'id', label: 'User ID', icon: Fingerprint },
  { key: 'memberSince', label: 'Member Since', icon: Calendar },
  { key: 'lastLogin', label: 'Last Login', icon: Clock },
  { key: 'emailVerified', label: 'Email Verified', icon: BadgeCheck },
  { key: 'accountStatus', label: 'Account Status', icon: Shield },
  { key: 'passwordLastChanged', label: 'Password Last Changed', icon: Clock },
  { key: 'twoFactorEnabled', label: 'Two-Factor Auth', icon: Shield },
];

function InfoRow({ label, value, icon: Icon }) {
  const displayValue =
    typeof value === 'boolean'
      ? value
        ? 'Yes'
        : 'No'
      : value;

  if (value === null || value === undefined || value === '') return null;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted shrink-0" />
        <span className="text-sm text-muted">{label}</span>
      </div>
      <span className="text-sm font-medium text-text">{displayValue}</span>
    </div>
  );
}

function InfoSection({ title, fields, data, className = '' }) {
  const hasData = fields.some((f) => {
    const val = data?.[f.key];
    return val !== null && val !== undefined && val !== '';
  });

  return (
    <DashboardSection title={title} className={className}>
      {hasData ? (
        <div className="divide-y divide-border">
          {fields.map((field) => (
            <InfoRow
              key={field.key}
              label={field.label}
              value={data?.[field.key]}
              icon={field.icon}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted text-center py-4">
          No {title.toLowerCase()} available yet.
        </p>
      )}
    </DashboardSection>
  );
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const mountedRef = useRef(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, statsData] = await Promise.all([
        fetchProfile(),
        fetchProfileStats(),
      ]);
      if (!mountedRef.current) return;
      setUser(profileData);
      setStats(statsData);
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
    loadProfile();
    return () => {
      mountedRef.current = false;
    };
  }, [loadProfile]);

  const validatePasswordForm = () => {
    const errors = {};
    if (!currentPassword.trim()) errors.currentPassword = 'Current password is required';
    if (!newPassword.trim()) errors.newPassword = 'New password is required';
    else if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (!confirmPassword.trim()) errors.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch {
      toast.error('Failed to update password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    window.location.href = '/login';
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      window.location.href = '/login';
    } catch {
      toast.error('Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={loadProfile} />;
  }

  const content = [
    { key: 'contractsUploaded', label: 'Contracts Uploaded', icon: FileText, gradient: 'from-primary to-secondary' },
    { key: 'questionsAsked', label: 'Questions Asked', icon: MessageSquare, gradient: 'from-accent to-cyan-500' },
    { key: 'conversations', label: 'Conversations', icon: ListTodo, gradient: 'from-green-500 to-emerald-500' },
  ];

  const hasStats = content.some((c) => stats?.[c.key] !== null);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-1">Profile</h1>
        <p className="text-muted">Manage your account information and security settings.</p>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto mb-8">
        <ProfileCard user={user} />
      </div>

      {/* Personal Information + Account Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <InfoSection
          title="Personal Information"
          fields={PERSONAL_FIELDS}
          data={user}
        />
        <InfoSection
          title="Account Information"
          fields={ACCOUNT_FIELDS}
          data={user}
        />
      </div>

      {/* Quick Statistics */}
      {hasStats && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {content.map((c) => {
              const val = stats?.[c.key];
              if (val === null) return null;
              return (
                <DashboardStatCard
                  key={c.key}
                  icon={c.icon}
                  label={c.label}
                  value={val}
                  gradient={c.gradient}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Security */}
      <DashboardSection title="Security" className="mb-8">
        <p className="text-sm text-muted mb-6">
          Update your password to maintain account security.
        </p>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            icon={Lock}
            type="password"
            passwordToggle
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (passwordErrors.currentPassword) {
                setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
              }
            }}
            error={passwordErrors.currentPassword}
          />
          <Input
            label="New Password"
            icon={Lock}
            type="password"
            passwordToggle
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordErrors.newPassword) {
                setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
              }
            }}
            error={passwordErrors.newPassword}
          />
          <Input
            label="Confirm New Password"
            icon={Lock}
            type="password"
            passwordToggle
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (passwordErrors.confirmPassword) {
                setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            error={passwordErrors.confirmPassword}
          />
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={passwordLoading} disabled={passwordLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </DashboardSection>

      {/* Danger Zone */}
      <DashboardSection title="Danger Zone" className="mb-8">
        <div className="divide-y divide-border">
          {/* Logout */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-text">Logout</p>
              <p className="text-xs text-muted">
                Sign out of your account and return to the login page.
              </p>
            </div>
            <Button
              variant="outline"
              icon={LogOut}
              onClick={handleLogout}
              className="!text-error hover:!bg-error/5 hover:!border-error/30"
            >
              Logout
            </Button>
          </div>

          {/* Delete Account */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Delete Account</p>
                <p className="text-xs text-muted">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              {!deleteConfirmOpen && (
                <Button
                  variant="outline"
                  icon={Trash2}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="!text-error hover:!bg-error/5 hover:!border-error/30"
                >
                  Delete
                </Button>
              )}
            </div>

            {/* Delete confirmation */}
            {deleteConfirmOpen && (
              <div className="mt-4 p-4 rounded-xl bg-error/5 border border-error/20">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-error" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Are you absolutely sure?</p>
                    <p className="text-xs text-muted mt-0.5">
                      This will permanently delete your account, documents, and all associated data. You will not be able to recover anything.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setDeleteLoading(false);
                    }}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    icon={Trash2}
                    loading={deleteLoading}
                    disabled={deleteLoading}
                    onClick={handleDeleteAccount}
                    className="!bg-error hover:!bg-error/90 !text-white"
                  >
                    Delete My Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
