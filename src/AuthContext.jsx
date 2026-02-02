import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurar axios para enviar token
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    // Validar token ou carregar usuário (opcional, aqui só checamos se tem token)
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3001/login', { email, password });
      const { token, auth } = response.data;
      if (auth) {
        setToken(token);
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return true;
      }
    } catch (error) {
      if (!error.response) {
        throw { response: { data: { error: 'Servidor indisponível' } } };
      }
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      await axios.post('http://localhost:3001/register', { email, password });
      return true;
    } catch (error) {
      if (!error.response) {
        throw { response: { data: { error: 'Servidor indisponível' } } };
      }
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
