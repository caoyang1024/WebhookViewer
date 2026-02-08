import { useAuthContext } from '../../context/AuthContext';

interface Props {
  onLoginClick: () => void;
  onUsersClick: () => void;
  onChangePasswordClick: () => void;
}

export function UserMenu({ onLoginClick, onUsersClick, onChangePasswordClick }: Props) {
  const { user, logout, can } = useAuthContext();

  if (!user) {
    return (
      <button
        onClick={onLoginClick}
        style={{
          padding: '4px 12px',
          fontSize: 12,
          border: '1px solid #475569',
          borderRadius: 4,
          background: 'transparent',
          color: '#94a3b8',
          cursor: 'pointer',
        }}
      >
        Login
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {can('manageUsers') && (
        <button
          onClick={onUsersClick}
          title="Manage Users"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </button>
      )}
      <button
        onClick={onChangePasswordClick}
        title="Change Password"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </button>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{user.username}</span>
      <button
        onClick={logout}
        style={{
          padding: '4px 12px',
          fontSize: 12,
          border: '1px solid #475569',
          borderRadius: 4,
          background: 'transparent',
          color: '#94a3b8',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}
