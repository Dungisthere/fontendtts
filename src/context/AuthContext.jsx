import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const success = await authService.login(username, password);
      if (success) {
        // Lưu một token giả để sử dụng cho các request cần xác thực
        // Trong môi trường thực tế, API sẽ trả về token thực
        localStorage.setItem('token', 'fake-token-for-development');
        await fetchUserData();
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng nhập thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setLoading(true);
    try {
      const data = await authService.register(username, email, password);
      setUser(data);
      localStorage.setItem('token', 'fake-token-for-development');
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 