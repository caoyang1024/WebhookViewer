export function Spinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      padding: 40,
      color: '#94a3b8',
    }}>
      <div style={{
        width: 24,
        height: 24,
        border: '3px solid #e2e8f0',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
}
