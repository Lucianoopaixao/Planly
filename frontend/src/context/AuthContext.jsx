import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/index.js';
import { tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { user, token } = await authApi.login(email, password);
    tokenStore.set(token);
    setUser(user);
  };

  const register = async (payload) => {
    const { user, token } = await authApi.register(payload);
    tokenStore.set(token);
    setUser(user);
  };

  const logout = () => { tokenStore.clear(); setUser(null); };

  const refreshUser = async () => {
    try {
      const u = await authApi.me();
      setUser(u);
      return u;
    } catch (err) {
      console.error('[AuthContext] erro ao recarregar usuario:', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);