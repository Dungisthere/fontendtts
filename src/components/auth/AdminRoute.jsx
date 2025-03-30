import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchUserData } from '../../redux/authSlice';

const AdminRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Nếu không có user trong Redux nhưng có trong localStorage
    if (!user && localStorage.getItem('user')) {
      dispatch(fetchUserData());
    }
  }, [user, dispatch]);

  // Nếu đang loading, có thể hiển thị spinner hoặc không làm gì
  if (loading) {
    return null;
  }

  // Lấy user từ localStorage nếu không có trong Redux
  const userFromStorage = !user ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  
  // Kiểm tra user từ Redux hoặc localStorage
  if ((!user && !userFromStorage) || (user && user.usertype !== 'admin') || (userFromStorage && userFromStorage.usertype !== 'admin')) {
    return <Navigate to="/tts" />;
  }

  // Nếu có user và là admin, render children
  return children;
};

export default AdminRoute; 