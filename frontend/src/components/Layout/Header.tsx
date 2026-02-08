import type { ConnectionStatus } from '../../services/signalr';
import { UserMenu } from '../Auth/UserMenu';

const statusColors: Record<ConnectionStatus, string> = {
  connected: '#22c55e',
  reconnecting: '#eab308',
  disconnected: '#ef4444',
};

const statusLabels: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  disconnected: 'Disconnected',
};

interface Props {
  connectionStatus: ConnectionStatus;
  onSettingsOpen: () => void;
  onLoginClick: () => void;
  onUsersClick: () => void;
}

export function Header({ connectionStatus, onSettingsOpen, onLoginClick, onUsersClick }: Props) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 20px',
      background: '#1e293b',
      color: '#f8fafc',
      borderBottom: '1px solid #334155',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Log Viewer</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <UserMenu onLoginClick={onLoginClick} onUsersClick={onUsersClick} />
        <button
          onClick={onSettingsOpen}
          title="Settings"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            fontSize: 18,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
        <code style={{
          fontSize: 12,
          background: '#334155',
          padding: '4px 8px',
          borderRadius: 4,
          color: '#94a3b8',
        }}>
          POST /api/webhook/your-path
        </code>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColors[connectionStatus],
            boxShadow: `0 0 6px ${statusColors[connectionStatus]}`,
          }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{statusLabels[connectionStatus]}</span>
        </div>
      </div>
    </header>
  );
}
