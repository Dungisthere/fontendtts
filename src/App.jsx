import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import store from './redux/store';
import MainLayout from './components/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import TextToSpeech from './components/tts/TextToSpeech';
import PrivateRoute from './components/auth/PrivateRoute';
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

function App() {
  useEffect(() => {
    // Kiểm tra xem có token không và fetch dữ liệu user
    const token = localStorage.getItem('token');
    if (token) {
      store.dispatch(fetchUserData());
    }
  }, []);

  return (
    <Provider store={store}>
      <ConfigProvider locale={viVN}>
        <div style={appStyles}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
              <Route path="/" element={<Navigate to="/tts" replace />} />
            </Routes>
          </Router>
        </div>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
