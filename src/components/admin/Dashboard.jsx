import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Table, Tag, Spin, Button } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  WalletOutlined,
  ArrowUpOutlined,
  SoundOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { adminService } from '../../services/adminApi';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCredits: 0,
    recentUsers: [],
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Gọi API thực tế để lấy dữ liệu chính xác
      const response = await adminService.getDashboardStats();
      console.log("Dữ liệu thống kê từ API:", response);
      
      // Đảm bảo dữ liệu hợp lệ trước khi cập nhật state
      if (response && typeof response === 'object') {
        setStats({
          totalUsers: response.totalUsers || 0,
          activeUsers: response.activeUsers || 0,
          totalCredits: response.totalCredits || 0,
          recentUsers: response.recentUsers || [],
        });
      } else {
        console.error('Dữ liệu API không đúng định dạng:', response);
      }
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu Dashboard:', error);
      // Nếu API lỗi, sử dụng dữ liệu mẫu
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalCredits: 0,
        recentUsers: []
      });
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    // {
    //   title: 'Credits',
    //   dataIndex: 'credits',
    //   key: 'credits',
    //   render: (credits) => `${credits.toLocaleString('vi-VN')}`,
    // },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      ),
    },
    {
      title: 'Loại tài khoản',
      dataIndex: 'usertype',
      key: 'usertype',
      render: (type) => (
        <Tag color={type === 'admin' ? 'blue' : 'default'}>
          {type === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </Tag>
      ),
    },
    // {
    //   title: 'Ngày tạo',
    //   dataIndex: 'createdAt',
    //   key: 'createdAt',
    // },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Tổng quan hệ thống</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchStats}
          type="primary"
        >
          Làm mới dữ liệu
        </Button>
      </div>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable>
            <Statistic
              title="Tổng số người dùng"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Card hoverable>
            <Statistic
              title="Người dùng hoạt động"
              value={stats.activeUsers}
              prefix={<UserOutlined />}
              suffix={`/${stats.totalUsers}`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        {/* <Col xs={24} sm={12} md={8}>
          <Card hoverable>
            <Statistic
              title="Tổng số Credits"
              value={stats.totalCredits}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col> */}
      </Row>
      
      <Card 
        title="Người dùng gần đây" 
        extra={<a href="/admin/users">Xem tất cả</a>}
        style={{ marginBottom: 24 }}
      >
        <Table 
          columns={columns} 
          dataSource={stats.recentUsers} 
          rowKey="id" 
          pagination={false} 
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default Dashboard; 