import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchUserData } from '../../redux/authSlice';

const PrivateRoute = ({ children }) => {
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

  // Kiểm tra user từ localStorage thay vì token
  if (!user && !localStorage.getItem('user')) {
    return <Navigate to="/login" />;
  }

  // Nếu có user, render children
  return children;
};

export default PrivateRoute; 