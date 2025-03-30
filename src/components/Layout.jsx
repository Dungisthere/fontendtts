import { Layout, Menu, Button, Avatar, Dropdown, message, Badge } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SoundOutlined, 
  HomeOutlined, 
  BellOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

const { Header, Content, Footer, Sider } = Layout;

const MainLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    message.success('Đăng xuất thành công!');
    navigate('/login');
  };

  const items = [
    {
      key: '/tts',
      icon: <SoundOutlined />,
      label: 'Chuyển văn bản thành giọng nói',
      onClick: () => navigate('/tts')
    }
  ];

  // Thêm menu admin nếu người dùng có quyền admin
  if (user && user.usertype === 'admin') {
    items.push({
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Quản trị hệ thống',
      onClick: () => navigate('/admin')
    });
  }

  const userMenuItems = {
    items: [
      {
        key: '1',
        label: 'Thông tin tài khoản',
        icon: <UserOutlined />,
      },
      {
        key: '2',
        label: 'Cài đặt',
        icon: <SettingOutlined />,
      },
      // Thêm menu admin cho dropdown nếu người dùng có quyền admin
      ...(user && user.usertype === 'admin' ? [{
        key: 'admin',
        label: 'Trang quản trị',
        icon: <SettingOutlined />,
        onClick: () => navigate('/admin'),
      }] : []),
      {
        type: 'divider',
      },
      {
        key: '3',
        label: 'Đăng xuất',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh', width: '100%' }}>
      <Header
        style={{
          position: 'fixed',
          top: 0,
          zIndex: 10,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <SoundOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '10px' }} />
            <h2 style={{ margin: 0, color: '#1890ff' }}>TTS App</h2>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <>
              <Badge count={0} dot>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: '20px' }} />}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Badge>

              <Dropdown
                menu={userMenuItems}
                placement="bottomRight"
                arrow
                trigger={['click']}
              >
                <Button
                  type="text"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    height: '40px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <Avatar 
                    icon={<UserOutlined />} 
                    style={{ backgroundColor: '#1890ff' }} 
                  />
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </span>
                </Button>
              </Dropdown>
            </>
          )}

          {!user && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="link" onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                Đăng ký
              </Button>
            </div>
          )}
        </div>
      </Header>

      <Layout style={{ marginTop: 64, width: '100%' }}>
        <Content style={{ padding: '24px', backgroundColor: '#f5f8ff', width: '100%' }}>
          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </Content>
      </Layout>

      <Footer style={{ textAlign: 'center', background: '#f0f0f0', padding: '12px 50px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <span>TTS App ©{new Date().getFullYear()} - Chuyển văn bản thành giọng nói</span>
          <div>
            <Button 
              type="link" 
              icon={<HomeOutlined />} 
              onClick={() => navigate('/')}
              size="small"
            >
              Trang chủ
            </Button>
            {user && user.usertype === 'admin' && (
              <Button
                type="link"
                icon={<SettingOutlined />}
                onClick={() => navigate('/admin')}
                size="small"
              >
                Quản trị
              </Button>
            )}
            {user && (
              <Button
                type="link"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                size="small"
              >
                Đăng xuất
              </Button>
            )}
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout; 