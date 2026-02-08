import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Layout/Header';
import { FilterBar } from './components/Filters/FilterBar';
import { ActionBar } from './components/Actions/ActionBar';
import { MessageList } from './components/MessageList/MessageList';
import { SettingsModal } from './components/Settings/SettingsModal';
import { LoginModal } from './components/Auth/LoginModal';
import { UserManagement } from './components/Auth/UserManagement';
import { useMessageFilter } from './hooks/useMessageFilter';
import { useWebhookMessages } from './hooks/useWebhookMessages';
import { deleteMessage } from './services/api';

export default function App() {
  const { filter, setLevels, setPathContains, setSearchPattern, setDateRange, setPage, resetFilters } = useMessageFilter();
  const { data, loading, connectionStatus, selectedIds, toggleSelection, selectAll, clearSelection, refresh } = useWebhookMessages(filter);
  const [autoScroll, setAutoScroll] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const handleDelete = useCallback(async (id: string) => {
    await deleteMessage(id);
    refresh();
  }, [refresh]);

  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [data.items, autoScroll]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e293b',
    }}>
      <Header
        connectionStatus={connectionStatus}
        onSettingsOpen={() => setSettingsOpen(true)}
        onLoginClick={() => setLoginOpen(true)}
        onUsersClick={() => setUsersOpen(true)}
      />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {usersOpen && <UserManagement onClose={() => setUsersOpen(false)} />}
      <FilterBar
        filter={filter}
        onLevelsChange={setLevels}
        onPathContainsChange={setPathContains}
        onSearchChange={setSearchPattern}
        onDateChange={setDateRange}
        onReset={resetFilters}
      />
      <ActionBar
        totalCount={data.totalCount}
        selectedCount={selectedIds.size}
        selectedIds={selectedIds}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onRefresh={refresh}
        autoScroll={autoScroll}
        onAutoScrollToggle={() => setAutoScroll(s => !s)}
      />
      <div ref={listRef} style={{ flex: 1, overflow: 'auto' }}>
        <MessageList
          data={data}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelection}
          onDelete={handleDelete}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
