const LEVELS = [
  { key: 'Verbose', label: 'VRB', bg: '#f1f5f9', bgActive: '#e2e8f0', text: '#64748b' },
  { key: 'Debug', label: 'DBG', bg: '#f1f5f9', bgActive: '#e2e8f0', text: '#64748b' },
  { key: 'Information', label: 'INF', bg: '#eff6ff', bgActive: '#dbeafe', text: '#1e40af' },
  { key: 'Warning', label: 'WRN', bg: '#fffbeb', bgActive: '#fef3c7', text: '#92400e' },
  { key: 'Error', label: 'ERR', bg: '#fef2f2', bgActive: '#fecaca', text: '#991b1b' },
  { key: 'Fatal', label: 'FTL', bg: '#faf5ff', bgActive: '#f3e8ff', text: '#6b21a8' },
];

interface Props {
  selected: string | undefined;
  onChange: (levels: string | undefined) => void;
}

export function LevelFilter({ selected, onChange }: Props) {
  const selectedLevels = selected ? selected.split(',') : [];

  const toggle = (level: string) => {
    let next: string[];
    if (selectedLevels.includes(level)) {
      next = selectedLevels.filter(l => l !== level);
    } else {
      next = [...selectedLevels, level];
    }
    onChange(next.length > 0 ? next.join(',') : undefined);
  };

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {LEVELS.map(({ key, label, bg, bgActive, text }) => {
        const active = selectedLevels.includes(key);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            title={key}
            style={{
              padding: '3px 7px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'monospace',
              border: `1px solid ${active ? text : '#e2e8f0'}`,
              borderRadius: 4,
              background: active ? bgActive : bg,
              color: active ? text : '#94a3b8',
              cursor: 'pointer',
              opacity: active ? 1 : 0.5,
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
