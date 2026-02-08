import { useState } from 'react';
import { batchDelete, deleteMessage } from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface Props {
  totalCount: number;
  selectedCount: number;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRefresh: () => void;
  autoScroll: boolean;
  onAutoScrollToggle: () => void;
}

type ConfirmAction = 'selected' | 'all' | null;

export function ActionBar({
  totalCount,
  selectedCount,
  selectedIds,
  onSelectAll,
  onClearSelection,
  onRefresh,
  autoScroll,
  onAutoScrollToggle,
}: Props) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const { can } = useAuthContext();

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 1) {
      await deleteMessage([...selectedIds][0]);
    } else {
      await batchDelete({ ids: [...selectedIds] });
    }
    setConfirmAction(null);
    onClearSelection();
    onRefresh();
  };

  const handleDeleteAll = async () => {
    await batchDelete({ all: true });
    setConfirmAction(null);
    onClearSelection();
    onRefresh();
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderBottom: '1px solid #e2e8f0',
        background: '#fff',
      }}>
        <button
          onClick={selectedCount > 0 ? onClearSelection : onSelectAll}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            background: '#fff',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          {selectedCount > 0 ? 'Deselect All' : 'Select All'}
        </button>

        {selectedCount > 0 && (selectedCount === 1 ? can('deleteSingle') : can('deleteBulk')) && (
          <button
            onClick={() => setConfirmAction('selected')}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #fca5a5',
              borderRadius: 4,
              background: '#fef2f2',
              color: '#991b1b',
              cursor: 'pointer',
            }}
          >
            Delete Selected ({selectedCount})
          </button>
        )}

        {totalCount > 0 && can('deleteBulk') && (
          <button
            onClick={() => setConfirmAction('all')}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #fca5a5',
              borderRadius: 4,
              background: '#fff',
              color: '#991b1b',
              cursor: 'pointer',
            }}
          >
            Delete All
          </button>
        )}

        <div style={{ flex: 1 }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={onAutoScrollToggle}
          />
          Auto-scroll
        </label>

        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {totalCount} message{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {confirmAction === 'selected' && (
        <DeleteConfirmDialog
          message={`Delete ${selectedCount} selected message${selectedCount !== 1 ? 's' : ''}?`}
          onConfirm={handleDeleteSelected}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'all' && (
        <DeleteConfirmDialog
          message={`Delete all ${totalCount} message${totalCount !== 1 ? 's' : ''}? This cannot be undone.`}
          onConfirm={handleDeleteAll}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}
