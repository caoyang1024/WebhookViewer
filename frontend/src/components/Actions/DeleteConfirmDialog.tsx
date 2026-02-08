interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        padding: 24,
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h3 style={{ margin: '0 0 12px', color: '#334155' }}>Confirm Delete</h3>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              background: '#fff',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              border: '1px solid #ef4444',
              borderRadius: 4,
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
