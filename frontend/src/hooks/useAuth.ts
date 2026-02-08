import { useCallback, useEffect, useState } from 'react';
import type { UserInfo, UserPermissions } from '../types/auth';
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await apiLogin({ username, password });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: keyof UserPermissions): boolean => {
      if (!user) return false;
      return user.permissions[permission];
    },
    [user],
  );

  return { user, loading, login, logout, can };
}
