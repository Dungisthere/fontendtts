import { useState, useEffect } from 'react';
import { Table, Card, Statistic, Typography, Row, Col, Tag, Spin, DatePicker, Button, Space, message } from 'antd';
import { 
  WalletOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { adminService } from '../../services/adminApi';
import locale from 'antd/es/date-picker/locale/vi_VN';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const Credits = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCredits: 0,
    totalAddedCredits: 0,
    totalDeductedCredits: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchCreditStats();
    fetchTransactions();
  }, []);

  const fetchCreditStats = async () => {
    try {
      setLoading(true);
      // Gọi API thực
      const response = await adminService.getCreditStats();
      console.log("Dữ liệu thống kê credits từ API:", response);
      
      if (response && typeof response === 'object') {
        setStats({
          totalCredits: response.totalCredits || 0,
          totalAddedCredits: response.totalAddedCredits || 0,
          totalDeductedCredits: response.totalDeductedCredits || 0
        });
      } else {
        console.error('Dữ liệu API không đúng định dạng:', response);
        message.error('Không thể tải dữ liệu thống kê');
      }
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy thống kê credits:', error);
      message.error('Lỗi khi tải dữ liệu thống kê');
      // Nếu API lỗi, sử dụng dữ liệu mặc định
      setStats({
        totalCredits: 0,
        totalAddedCredits: 0,
        totalDeductedCredits: 0
      });
      setLoading(false);
    }
  };

  const fetchTransactions = async (start = null, end = null) => {
    try {
      setLoading(true);
      // Gọi API thực
      const response = await adminService.getCreditTransactions(start, end);
      console.log("Dữ liệu giao dịch credits từ API:", response);
      
      if (response && Array.isArray(response)) {
        setTransactions(response);
      } else {
        console.error('Dữ liệu API không đúng định dạng:', response);
        message.error('Không thể tải dữ liệu giao dịch');
        setTransactions([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử giao dịch:', error);
      message.error('Lỗi khi tải dữ liệu giao dịch');
      setTransactions([]);
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (dates) {
      fetchTransactions(dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD'));
    } else {
      fetchTransactions();
    }
  };

  const handleReset = () => {
    setDateRange(null);
    fetchTransactions();
    fetchCreditStats();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'ID người dùng',
      dataIndex: 'userId',
      key: 'userId',
      width: 100,
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'add' ? 'green' : 'red'}>
          {type === 'add' ? 'Nạp tiền' : 'Trừ tiền'}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span style={{ color: record.type === 'add' ? 'green' : 'red' }}>
          {record.type === 'add' ? '+' : '-'} {amount.toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Số dư sau giao dịch',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => balance.toLocaleString('vi-VN'),
    },
    {
      title: 'Ngày giao dịch',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>Quản lý Credits</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleReset}
          type="primary"
        >
          Làm mới dữ liệu
        </Button>
      </div>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Tổng số Credits trong hệ thống"
              value={stats.totalCredits}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Tổng số Credits đã nạp"
              value={stats.totalAddedCredits}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Tổng số Credits đã trừ"
              value={stats.totalDeductedCredits}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Lịch sử giao dịch Credits" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <RangePicker 
              locale={locale}
              onChange={handleDateRangeChange}
              value={dateRange}
            />
            <Button 
              icon={<SearchOutlined />} 
              type="primary"
              onClick={() => dateRange && fetchTransactions(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'))}
            >
              Tìm kiếm
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
            >
              Làm mới
            </Button>
          </Space>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={transactions} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'Không có dữ liệu giao dịch' }}
        />
      </Card>
    </div>
  );
};

export default Credits; 