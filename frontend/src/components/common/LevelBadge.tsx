const levelColors: Record<string, { bg: string; text: string }> = {
  verbose: { bg: '#f1f5f9', text: '#64748b' },
  debug: { bg: '#f1f5f9', text: '#64748b' },
  information: { bg: '#dbeafe', text: '#1e40af' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  error: { bg: '#fecaca', text: '#991b1b' },
  fatal: { bg: '#f3e8ff', text: '#6b21a8' },
};

const levelAbbreviations: Record<string, string> = {
  verbose: 'VRB',
  debug: 'DBG',
  information: 'INF',
  warning: 'WRN',
  error: 'ERR',
  fatal: 'FTL',
};

interface Props {
  level: string | null;
}

export function LevelBadge({ level }: Props) {
  if (!level) return null;

  const key = level.toLowerCase();
  const colors = levelColors[key];
  if (!colors) return null;

  const abbr = levelAbbreviations[key] ?? level.slice(0, 3).toUpperCase();

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: 'monospace',
      background: colors.bg,
      color: colors.text,
      minWidth: 36,
      textAlign: 'center',
    }}>
      {abbr}
    </span>
  );
}
