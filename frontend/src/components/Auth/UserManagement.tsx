import { useEffect, useState } from 'react';
import type { UserInfo, UserPermissions } from '../../types/auth';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../services/api';

interface Props {
  onClose: () => void;
}

const PERMS: { key: keyof UserPermissions; label: string }[] = [
  { key: 'deleteSingle', label: 'Delete Single' },
  { key: 'deleteBulk', label: 'Delete Bulk' },
  { key: 'manageSettings', label: 'Manage Settings' },
  { key: 'manageUsers', label: 'Manage Users' },
];

const emptyPerms: UserPermissions = {
  deleteSingle: false,
  deleteBulk: false,
  manageSettings: false,
  manageUsers: false,
};

export function UserManagement({ onClose }: Props) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPerms, setNewPerms] = useState<UserPermissions>({ ...emptyPerms });
  const [adding, setAdding] = useState(false);

  const load = () => {
    fetchUsers().then(setUsers).catch(() => setError('Failed to load users'));
  };

  useEffect(load, []);

  const handleCreate = async () => {
    if (!newUsername || !newPassword) return;
    setAdding(true);
    setError(null);
    try {
      await createUser({ username: newUsername, password: newPassword, permissions: newPerms });
      setNewUsername('');
      setNewPassword('');
      setNewPerms({ ...emptyPerms });
      load();
    } catch {
      setError('Failed to create user');
    } finally {
      setAdding(false);
    }
  };

  const handleTogglePerm = async (user: UserInfo, perm: keyof UserPermissions) => {
    const updated = { ...user.permissions, [perm]: !user.permissions[perm] };
    try {
      await updateUser(user.username, { permissions: updated });
      load();
    } catch {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (username: string) => {
    try {
      await deleteUser(username);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete user');
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#f8fafc',
    fontSize: 13,
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
          width: 600,
          maxHeight: '80vh',
          overflow: 'auto',
          color: '#f8fafc',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>User Management</h2>

        {error && (
          <div style={{
            padding: '8px 12px',
            marginBottom: 16,
            background: '#fecaca',
            color: '#991b1b',
            borderRadius: 4,
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* User list */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px', color: '#94a3b8' }}>User</th>
              {PERMS.map(p => (
                <th key={p.key} style={{ textAlign: 'center', padding: '8px 4px', color: '#94a3b8', fontSize: 11 }}>{p.label}</th>
              ))}
              <th style={{ width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.username} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '8px 6px', fontFamily: 'monospace' }}>{u.username}</td>
                {PERMS.map(p => (
                  <td key={p.key} style={{ textAlign: 'center', padding: '8px 4px' }}>
                    <input
                      type="checkbox"
                      checked={u.permissions[p.key]}
                      onChange={() => handleTogglePerm(u, p.key)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <button
                    onClick={() => handleDelete(u.username)}
                    style={{
                      padding: '2px 8px',
                      fontSize: 11,
                      border: '1px solid #fca5a5',
                      borderRadius: 4,
                      background: 'transparent',
                      color: '#fca5a5',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add user */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>Add User</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              placeholder="Username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <input
              placeholder="Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {PERMS.map(p => (
              <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newPerms[p.key]}
                  onChange={() => setNewPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                />
                {p.label}
              </label>
            ))}
          </div>
          <button
            onClick={handleCreate}
            disabled={adding || !newUsername || !newPassword}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: adding ? 'not-allowed' : 'pointer',
              opacity: adding || !newUsername || !newPassword ? 0.6 : 1,
            }}
          >
            {adding ? 'Creating...' : 'Create User'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: '1px solid #475569',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
