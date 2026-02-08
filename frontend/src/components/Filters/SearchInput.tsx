import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string | undefined;
  onChange: (pattern: string | undefined) => void;
}

export function SearchInput({ value, onChange }: Props) {
  const [local, setLocal] = useState(value ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const handleChange = (val: string) => {
    setLocal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(val || undefined);
    }, 300);
  };

  // Validate regex
  let isValid = true;
  if (local) {
    try { new RegExp(local); } catch { isValid = false; }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search (regex)..."
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          padding: '6px 10px',
          fontSize: 13,
          border: `1px solid ${!isValid ? '#ef4444' : '#cbd5e1'}`,
          borderRadius: 4,
          width: 220,
          outline: 'none',
          fontFamily: 'monospace',
        }}
      />
      {!isValid && (
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#ef4444' }}>
          Invalid regex
        </span>
      )}
    </div>
  );
}
