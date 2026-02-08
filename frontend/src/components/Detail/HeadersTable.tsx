interface Props {
  headers: Record<string, string[]>;
}

export function HeadersTable({ headers }: Props) {
  const entries = Object.entries(headers);
  if (entries.length === 0) return <p style={{ color: '#94a3b8' }}>No headers</p>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
          <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b' }}>Header</th>
          <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b' }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, values]) => (
          <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '4px 8px', fontFamily: 'monospace', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
              {key}
            </td>
            <td style={{ padding: '4px 8px', fontFamily: 'monospace', color: '#475569', wordBreak: 'break-all' }}>
              {values.join(', ')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
