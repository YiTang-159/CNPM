import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, session } from '../api/client.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => session.load());

  const finish = useCallback((res) => {
    setUser(res.user);
    session.save(res.user);
    return res.user;
  }, []);

  const login = useCallback(async (data) => finish(await api.login(data)), [finish]);
  const register = useCallback(async (data) => finish(await api.register(data)), [finish]);
  const updateUser = useCallback((data) => {
    setUser((current) => { const changed = { ...current, ...data }; session.save(changed); return changed; });
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    session.clear();
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, updateUser }), [user, login, register, logout, updateUser]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
