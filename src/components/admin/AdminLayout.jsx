import { useState } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown, Button, message } from 'antd';
import { 
  UserOutlined, 
  DashboardOutlined, 
  TeamOutlined, 
  WalletOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  KeyOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';

const { Header, Sider, Content, Footer } = Layout;

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    message.success('Đăng xuất thành công!');
    navigate('/login');
  };

  const userMenuItems = {
    items: [
      {
        // key: '1',
        // label: 'Thông tin tài khoản',
        // icon: <UserOutlined />,
      },
      // {
      //   key: '2',
      //   label: 'Cài đặt',
      //   icon: <SettingOutlined />,
      // },
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

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
      onClick: () => navigate('/admin')
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: 'Quản lý người dùng',
      onClick: () => navigate('/admin/users')
    },
    {
      key: '/admin/roles',
      icon: <KeyOutlined />,
      label: 'Phân quyền',
      onClick: () => navigate('/admin/roles')
    },
    {
      key: '/admin/system-config',
      icon: <ToolOutlined />,
      label: 'Cài đặt hệ thống',
      onClick: () => navigate('/admin/system-config')
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={250} 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 999,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ 
          height: '64px', 
          margin: '16px 0', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          {!collapsed && <span>QUẢN TRỊ VIÊN</span>}
          {collapsed && <span>ADMIN</span>}
        </div>
        
        <Menu 
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 24px',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Badge count={5}>
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: '18px' }} />}
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
                  {user?.username || 'Admin'}
                </span>
              </Button>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: '280px' }}>
          {children}
        </Content>
        
        <Footer style={{ textAlign: 'center' }}>
          HiSpeech Admin ©{new Date().getFullYear()} - Hệ thống quản trị
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 