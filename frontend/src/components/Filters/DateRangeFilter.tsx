interface Props {
  from: string | undefined;
  to: string | undefined;
  onChange: (from?: string, to?: string) => void;
}

export function DateRangeFilter({ from, to, onChange }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="datetime-local"
        value={from ? from.slice(0, 16) : ''}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined, to)}
        style={{
          padding: '4px 8px',
          fontSize: 12,
          border: '1px solid #cbd5e1',
          borderRadius: 4,
        }}
      />
      <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
      <input
        type="datetime-local"
        value={to ? to.slice(0, 16) : ''}
        onChange={(e) => onChange(from, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
        style={{
          padding: '4px 8px',
          fontSize: 12,
          border: '1px solid #cbd5e1',
          borderRadius: 4,
        }}
      />
    </div>
  );
}
