import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  // Nếu đang loading, có thể hiển thị spinner hoặc không làm gì
  if (loading) {
    return null;
  }

  // Nếu không có user, chuyển hướng đến trang đăng nhập
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Nếu có user, render children
  return children;
};

export default PrivateRoute; 