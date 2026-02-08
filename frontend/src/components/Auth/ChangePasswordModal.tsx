import { useState } from 'react';
import { changePassword } from '../../services/api';

interface Props {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(onClose, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 4,
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#f8fafc',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1e293b',
          borderRadius: 8,
          border: '1px solid #334155',
          padding: 24,
          width: 360,
          color: '#f8fafc',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>Change Password</h2>

        {error && (
          <div style={{ padding: '8px 12px', marginBottom: 16, background: '#fecaca', color: '#991b1b', borderRadius: 4, fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '8px 12px', marginBottom: 16, background: '#bbf7d0', color: '#166534', borderRadius: 4, fontSize: 13 }}>
            Password changed successfully
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoFocus style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              style={{
                padding: '8px 16px', borderRadius: 4, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !currentPassword || !newPassword || !confirmPassword ? 0.6 : 1,
              }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
