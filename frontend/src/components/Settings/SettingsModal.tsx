import { useEffect, useState } from 'react';
import type { TTLSettings } from '../../types/webhook';
import { useAuthContext } from '../../context/AuthContext';
import { fetchSettings, updateSettings } from '../../services/api';

const LEVELS = [
  { key: 'verboseMinutes' as const, label: 'Verbose', colors: { bg: '#f1f5f9', text: '#64748b' } },
  { key: 'debugMinutes' as const, label: 'Debug', colors: { bg: '#f1f5f9', text: '#64748b' } },
  { key: 'informationMinutes' as const, label: 'Information', colors: { bg: '#dbeafe', text: '#1e40af' } },
  { key: 'warningMinutes' as const, label: 'Warning', colors: { bg: '#fef3c7', text: '#92400e' } },
  { key: 'errorMinutes' as const, label: 'Error', colors: { bg: '#fecaca', text: '#991b1b' } },
  { key: 'fatalMinutes' as const, label: 'Fatal', colors: { bg: '#f3e8ff', text: '#6b21a8' } },
];

const PRESETS = [
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: '24 hours', value: 1440 },
  { label: '3 days', value: 4320 },
  { label: '7 days', value: 10080 },
  { label: '14 days', value: 20160 },
  { label: '30 days', value: 43200 },
  { label: '90 days', value: 129600 },
  { label: 'Forever', value: 0 },
];

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const { can } = useAuthContext();
  const [settings, setSettings] = useState<TTLSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = can('manageSettings');

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => setError('Failed to load settings'));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      await updateSettings(settings);
      onClose();
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof TTLSettings, value: number) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
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
          width: 420,
          color: '#f8fafc',
        }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Settings</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94a3b8' }}>
          Set how long messages are kept per log level. Expired messages are automatically removed from Redis.
        </p>

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

        {!settings ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LEVELS.map(({ key, label, colors }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  background: colors.bg,
                  color: colors.text,
                  minWidth: 90,
                  textAlign: 'center',
                }}>
                  {label}
                </span>
                <select
                  value={settings[key]}
                  onChange={e => handleChange(key, Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !settings || !canSave}
            title={canSave ? undefined : 'Login with settings permission to save'}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: saving || !canSave ? 'not-allowed' : 'pointer',
              opacity: saving || !canSave ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
