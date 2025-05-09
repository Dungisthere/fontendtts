import { useEffect, useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, message, Badge } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SoundOutlined, 
  HomeOutlined, 
  BellOutlined,
  SettingOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  BookOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { configService } from '../services/api';

const { Header, Content, Footer, Sider } = Layout;

const MainLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy thông tin cấu hình khi component được render
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await configService.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    message.success('Đăng xuất thành công!');
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'tts',
      label: <Link to="/tts">Text to Speech</Link>,
      icon: <SoundOutlined />,
    },
    {
      key: 'voice-library',
      label: <Link to="/voice-library">Voice Library</Link>,
      icon: <BookOutlined />,
    },
  ];

  // Thêm menu admin nếu người dùng có quyền admin
  if (user && user.usertype === 'admin') {
    menuItems.push({
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
        onClick: () => navigate('/profile'),
      },
      // {
      //   key: '2',
      //   label: 'Cài đặt',
      //   icon: <SettingOutlined />,
      // },
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
          zIndex: 1,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          padding: '0 30px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', marginRight: '30px' }}>
            {config && config.logo_base64 ? (
              <img 
                src={config.logo_base64} 
                alt={config.website_name || 'TTS App'} 
                style={{ height: '40px', marginRight: '10px' }} 
              />
            ) : (
              <SoundOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '10px' }} />
            )}
            <h2 style={{ margin: 0, color: '#1890ff' }}>
              {config && config.website_name ? config.website_name : 'TTS App'}
            </h2>
          </Link>
          
          {user && (
            <Menu
              mode="horizontal"
              style={{ border: 'none', background: 'transparent' }}
              selectedKeys={[location.pathname.split('/')[1] || 'tts']}
              items={menuItems}
            />
          )}
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

      <Footer style={{ textAlign: 'center', background: '#f0f0f0', padding: '24px 50px', width: '100%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px', textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                {config && config.logo_base64 ? (
                  <img 
                    src={config.logo_base64} 
                    alt={config.website_name || 'TTS App'} 
                    style={{ height: '50px', marginRight: '10px' }} 
                  />
                ) : (
                  <SoundOutlined style={{ fontSize: '32px', color: '#1890ff', marginRight: '10px' }} />
                )}
                <h2 style={{ margin: 0, color: '#333' }}>
                  {config && config.website_name ? config.website_name : 'TTS App'}
                </h2>
              </div>
              <p>Chuyển văn bản thành giọng nói với chất lượng cao</p>
              {config && config.website_url && (
                <p><GlobalOutlined /> <a href={config.website_url} target="_blank" rel="noopener noreferrer">{config.website_url}</a></p>
              )}
            </div>

            <div style={{ flex: '1', minWidth: '300px', textAlign: 'left', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Liên hệ với chúng tôi</h3>
              {config && config.phone_1 && (
                <p><PhoneOutlined /> {config.phone_1}</p>
              )}
              {config && config.phone_2 && (
                <p><PhoneOutlined /> {config.phone_2}</p>
              )}
              {config && config.email && (
                <p><MailOutlined /> <a href={`mailto:${config.email}`}>{config.email}</a></p>
              )}
            </div>

            <div style={{ flex: '1', minWidth: '300px', textAlign: 'left', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Truy cập nhanh</h3>
              <p>
                <Button 
                  type="link" 
                  icon={<HomeOutlined />} 
                  onClick={() => navigate('/')}
                  size="small"
                  style={{ padding: '0' }}
                >
                  Trang chủ
                </Button>
              </p>
              {user && user.usertype === 'admin' && (
                <p>
                  <Button
                    type="link"
                    icon={<SettingOutlined />}
                    onClick={() => navigate('/admin')}
                    size="small"
                    style={{ padding: '0' }}
                  >
                    Quản trị
                  </Button>
                </p>
              )}
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', marginTop: '10px' }}>
            <p style={{ margin: 0 }}>
              {config && config.website_name ? config.website_name : 'TTS App'} ©{new Date().getFullYear()} - Bản quyền thuộc về chúng tôi.
            </p>
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout; 