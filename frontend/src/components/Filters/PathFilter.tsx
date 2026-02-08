import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string | undefined;
  onChange: (pathContains: string | undefined) => void;
}

export function PathFilter({ value, onChange }: Props) {
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

  return (
    <input
      type="text"
      placeholder="Filter by path..."
      value={local}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        padding: '6px 10px',
        fontSize: 13,
        border: '1px solid #cbd5e1',
        borderRadius: 4,
        width: 160,
        outline: 'none',
        fontFamily: 'monospace',
      }}
    />
  );
}
