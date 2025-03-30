import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import store from './redux/store';
import MainLayout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import TextToSpeech from './components/tts/TextToSpeech';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import Dashboard from './components/admin/Dashboard';
import UserManagement from './components/admin/UserManagement';
import Credits from './components/admin/Credits';
import Roles from './components/admin/Roles';
import { fetchUserData } from './redux/authSlice';
import './App.css';

// Thêm CSS để đảm bảo toàn bộ app có chiều rộng 100%
const appStyles = {
  width: '100%',
  minWidth: '100%',
  maxWidth: '100%',
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
  overflow: 'hidden'
};

function AppContent() {
  useEffect(() => {
    // Kiểm tra xem có user không và fetch dữ liệu user
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      // Nếu có thông tin user, fetch lại dữ liệu user từ server
      store.dispatch(fetchUserData());
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route 
          path="/tts" 
          element={
            <PrivateRoute>
              <MainLayout>
                <TextToSpeech />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/users" 
          element={
            <AdminRoute>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/credits" 
          element={
            <AdminRoute>
              <AdminLayout>
                <Credits />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/admin/roles" 
          element={
            <AdminRoute>
              <AdminLayout>
                <Roles />
              </AdminLayout>
            </AdminRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/tts" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider locale={viVN}>
        <div style={appStyles}>
          <AppContent />
        </div>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
