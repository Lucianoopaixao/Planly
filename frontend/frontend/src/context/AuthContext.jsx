import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/index.js';
import { tokenStore } from '../api/client.js';
// responsavel por compartilhar os dados de autenticacao
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  //usuario autenticado
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
//verifica de tem token salvo 
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);
  //realiza o login e salva o token
  const login = async (email, password) => {
    const { user, token } = await authApi.login(email, password);
    tokenStore.set(token);
    setUser(user);
  };
  // realiza o cadastro e autentica o usuario
  const register = async (payload) => {
    const { user, token } = await authApi.register(payload);
    tokenStore.set(token);
    setUser(user);
  };
  //termina a sessao do usuario
  const logout = () => { tokenStore.clear(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
//pra acessar os dados de autenticacao
export const useAuth = () => useContext(AuthContext);
