import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { CopyButton } from '../common/CopyButton';

SyntaxHighlighter.registerLanguage('json', json);

interface Props {
  body: string | null;
}

function tryFormatJson(body: string): { formatted: string; isJson: boolean } {
  try {
    const parsed = JSON.parse(body);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: body, isJson: false };
  }
}

export function BodyViewer({ body }: Props) {
  if (!body) {
    return <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No body</p>;
  }

  const { formatted, isJson } = tryFormatJson(body);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {isJson ? 'JSON' : 'Plain Text'} &middot; {body.length} bytes
        </span>
        <CopyButton text={formatted} label="Copy Body" />
      </div>
      {isJson ? (
        <SyntaxHighlighter
          language="json"
          style={githubGist}
          customStyle={{
            padding: 12,
            borderRadius: 6,
            fontSize: 13,
            border: '1px solid #e2e8f0',
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {formatted}
        </SyntaxHighlighter>
      ) : (
        <pre style={{
          padding: 12,
          borderRadius: 6,
          fontSize: 13,
          border: '1px solid #e2e8f0',
          background: '#f8fafc',
          maxHeight: 400,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {formatted}
        </pre>
      )}
    </div>
  );
}
