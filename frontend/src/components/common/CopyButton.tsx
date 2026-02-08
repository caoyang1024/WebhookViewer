import { useState } from 'react';

interface Props {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Copy' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        border: '1px solid #cbd5e1',
        borderRadius: 4,
        background: copied ? '#dcfce7' : '#f8fafc',
        color: copied ? '#166534' : '#475569',
        cursor: 'pointer',
      }}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
