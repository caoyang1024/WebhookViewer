interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '12px 16px',
      borderTop: '1px solid #e2e8f0',
    }}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={{
          padding: '4px 12px',
          fontSize: 13,
          border: '1px solid #cbd5e1',
          borderRadius: 4,
          background: page <= 1 ? '#f1f5f9' : '#fff',
          color: page <= 1 ? '#94a3b8' : '#334155',
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
        }}
      >
        Previous
      </button>
      <span style={{ fontSize: 13, color: '#64748b' }}>
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={{
          padding: '4px 12px',
          fontSize: 13,
          border: '1px solid #cbd5e1',
          borderRadius: 4,
          background: page >= totalPages ? '#f1f5f9' : '#fff',
          color: page >= totalPages ? '#94a3b8' : '#334155',
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        Next
      </button>
    </div>
  );
}
