import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Input, 
  Modal, 
  Form, 
  Switch, 
  Select, 
  InputNumber, 
  Typography,
  message,
  Popconfirm,
  Tooltip,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  DollarOutlined,
  MinusCircleOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { adminService } from '../../services/adminApi';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  // State cho các Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const [isDeductCreditsModalOpen, setIsDeductCreditsModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [newPassword, setNewPassword] = useState('');
  
  const [form] = Form.useForm();
  const [addCreditsForm] = Form.useForm();
  const [deductCreditsForm] = Form.useForm();
  const [resetPasswordForm] = Form.useForm();

  // Lấy danh sách người dùng
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Gọi API thực tế
      const response = await adminService.getUsers();
      setUsers(response);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      message.error('Không thể lấy danh sách người dùng');
      // Nếu API lỗi, sử dụng dữ liệu mẫu
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com', credits: 1500, active: true, usertype: 'user' },
        { id: 2, username: 'admin1', email: 'admin1@example.com', credits: 2000, active: true, usertype: 'admin' },
        { id: 3, username: 'user3', email: 'user3@example.com', credits: 0, active: false, usertype: 'user' },
        { id: 4, username: 'user4', email: 'user4@example.com', credits: 500, active: true, usertype: 'user' },
        { id: 5, username: 'user5', email: 'user5@example.com', credits: 1200, active: true, usertype: 'user' },
      ];
      setUsers(mockUsers);
      setLoading(false);
    }
  };

  // Xử lý tìm kiếm
  const handleSearch = async () => {
    if (!searchText.trim()) {
      fetchUsers();
      return;
    }
    
    try {
      setLoading(true);
      // Gọi API thực tế
      const response = await adminService.searchUsers(searchText);
      setUsers(response);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm người dùng:', error);
      message.error('Không thể tìm kiếm người dùng');
      // Nếu API lỗi, mô phỏng tìm kiếm từ dữ liệu hiện có
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchText.toLowerCase()) || 
        user.email.toLowerCase().includes(searchText.toLowerCase())
      );
      setUsers(filtered);
      setLoading(false);
    }
  };

  // Mở modal thêm mới người dùng
  const showAddModal = () => {
    setModalMode('add');
    form.resetFields();
    setIsModalOpen(true);
  };

  // Mở modal chỉnh sửa người dùng
  const showEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      active: user.active,
      usertype: user.usertype,
    });
    setIsModalOpen(true);
  };

  // Mở modal nạp tiền
  const showAddCreditsModal = (user) => {
    setSelectedUser(user);
    addCreditsForm.resetFields();
    setIsAddCreditsModalOpen(true);
  };

  // Mở modal trừ tiền
  const showDeductCreditsModal = (user) => {
    setSelectedUser(user);
    deductCreditsForm.resetFields();
    setIsDeductCreditsModalOpen(true);
  };

  // Đóng tất cả các modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setIsAddCreditsModalOpen(false);
    setIsDeductCreditsModalOpen(false);
    setIsResetPasswordModalOpen(false);
  };

  // Xử lý thêm/cập nhật người dùng
  const handleSubmit = async (values) => {
    try {
      if (modalMode === 'add') {
        // Gọi API thực tế để thêm người dùng mới
        await adminService.createUser(values);
        message.success('Thêm người dùng thành công');
        fetchUsers(); // Cập nhật lại danh sách
      } else {
        // Gọi API thực tế để cập nhật người dùng
        await adminService.updateUser(selectedUser.id, values);
        message.success('Cập nhật người dùng thành công');
        fetchUsers(); // Cập nhật lại danh sách
      }
      
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('Lỗi khi thêm/cập nhật người dùng:', error);
      message.error('Không thể thêm/cập nhật người dùng');
    }
  };

  // Xử lý xóa người dùng
  const handleDelete = async (id) => {
    try {
      // Gọi API thực tế để xóa người dùng
      await adminService.deleteUser(id);
      message.success('Xóa người dùng thành công');
      fetchUsers(); // Cập nhật lại danh sách
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
      message.error('Không thể xóa người dùng');
    }
  };

  // Xử lý thay đổi trạng thái
  const handleStatusChange = async (user, newStatus) => {
    try {
      // Gọi API thực tế để thay đổi trạng thái người dùng
      await adminService.changeUserStatus(user.id, newStatus);
      message.success(`Người dùng đã được ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`);
      fetchUsers(); // Cập nhật lại danh sách
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái người dùng:', error);
      message.error('Không thể thay đổi trạng thái người dùng');
    }
  };

  // Xử lý thay đổi loại người dùng
  const handleUserTypeChange = async (user, newType) => {
    try {
      // Gọi API thực tế để thay đổi loại người dùng
      await adminService.changeUserType(user.id, newType);
      message.success(`Đã thay đổi loại người dùng thành ${newType === 'admin' ? 'Quản trị viên' : 'Người dùng thường'}`);
      fetchUsers(); // Cập nhật lại danh sách
    } catch (error) {
      console.error('Lỗi khi thay đổi loại người dùng:', error);
      message.error('Không thể thay đổi loại người dùng');
    }
  };

  // Xử lý nạp credits
  const handleAddCredits = async (values) => {
    try {
      // Gọi API thực tế để nạp credits
      console.log(`Đang gửi yêu cầu NẠP ${values.amount} credits cho người dùng ID ${selectedUser.id}`);
      const updatedUser = await adminService.addCredits(selectedUser.id, values.amount);
      console.log("Kết quả NẠP credits (user đã cập nhật):", updatedUser);
      
      if (updatedUser && updatedUser.credits !== undefined) {
        const previousCredits = selectedUser.credits || 0;
        const addedAmount = updatedUser.credits - previousCredits;
        message.success(`Đã nạp ${addedAmount.toLocaleString('vi-VN')} credits cho người dùng ${updatedUser.username}. Số dư hiện tại: ${updatedUser.credits.toLocaleString('vi-VN')}`);
      } else {
        message.success(`Đã nạp ${values.amount.toLocaleString('vi-VN')} credits cho người dùng ${selectedUser.username}`);
      }
      
      fetchUsers(); // Cập nhật lại danh sách
      setIsAddCreditsModalOpen(false);
      addCreditsForm.resetFields();
    } catch (error) {
      console.error('Lỗi khi nạp credits:', error);
      message.error(error.message || 'Không thể nạp credits');
    }
  };

  // Xử lý trừ credits
  const handleDeductCredits = async (values) => {
    try {
      // Kiểm tra số dư người dùng trước khi trừ
      const user = users.find(u => u.id === selectedUser.id);
      if (user && user.credits < values.amount) {
        message.error(`Số dư credits không đủ (hiện tại: ${user.credits.toLocaleString('vi-VN')})`);
        return;
      }
      
      // Gọi API thực tế để trừ credits
      console.log(`Đang gửi yêu cầu TRỪ ${values.amount} credits cho người dùng ID ${selectedUser.id}`);
      const updatedUser = await adminService.deductCredits(selectedUser.id, values.amount);
      console.log("Kết quả TRỪ credits (user đã cập nhật):", updatedUser);
      
      if (updatedUser && updatedUser.credits !== undefined) {
        const previousCredits = selectedUser.credits || 0;
        const deductedAmount = previousCredits - updatedUser.credits;
        message.success(`Đã trừ ${deductedAmount.toLocaleString('vi-VN')} credits từ người dùng ${updatedUser.username}. Số dư hiện tại: ${updatedUser.credits.toLocaleString('vi-VN')}`);
      } else {
        message.success(`Đã trừ ${values.amount.toLocaleString('vi-VN')} credits từ người dùng ${selectedUser.username}`);
      }
      
      fetchUsers(); // Cập nhật lại danh sách
      setIsDeductCreditsModalOpen(false);
      deductCreditsForm.resetFields();
    } catch (error) {
      console.error('Lỗi khi trừ credits:', error);
      message.error(error.message || 'Không thể trừ credits');
    }
  };

  // Xử lý reset mật khẩu
  const showResetPasswordModal = (user) => {
    setSelectedUser(user);
    resetPasswordForm.resetFields();
    setIsResetPasswordModalOpen(true);
  };
  
  const handleResetPassword = async (values) => {
    try {
      const result = await adminService.resetUserPassword(selectedUser.id, values.new_password);
      message.success('Mật khẩu đã được đặt lại thành công');
      setIsResetPasswordModalOpen(false);
    } catch (error) {
      console.error('Lỗi khi reset mật khẩu:', error);
      message.error('Không thể đặt lại mật khẩu');
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
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      render: (credits) => credits.toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active, record) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Hoạt động' : 'Vô hiệu hóa'}
        </Tag>
      ),
    },
    {
      title: 'Loại tài khoản',
      dataIndex: 'usertype',
      key: 'usertype',
      render: (usertype) => (
        <Tag color={usertype === 'admin' ? 'blue' : 'default'}>
          {usertype === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 350,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => showEditModal(record)}
              type="primary"
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Thay đổi trạng thái">
            <Button
              icon={record.active ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleStatusChange(record, !record.active)}
              type={record.active ? 'default' : 'primary'}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Thay đổi loại tài khoản">
            <Button
              icon={record.usertype === 'admin' ? <UserDeleteOutlined /> : <UserAddOutlined />}
              onClick={() => handleUserTypeChange(record, record.usertype === 'admin' ? 'user' : 'admin')}
              type={record.usertype === 'admin' ? 'default' : 'primary'}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Đặt lại mật khẩu">
            <Button
              icon={<KeyOutlined />}
              onClick={() => showResetPasswordModal(record)}
              type="default"
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="Nạp tiền">
            <Button
              icon={<DollarOutlined />}
              onClick={() => showAddCreditsModal(record)}
              type="primary"
              size="small"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            />
          </Tooltip>
          
          <Tooltip title="Trừ tiền">
            <Button
              icon={<MinusCircleOutlined />}
              onClick={() => showDeductCreditsModal(record)}
              type="primary"
              size="small"
              danger
            />
          </Tooltip>
          
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Tooltip title="Xóa">
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Quản lý người dùng</Title>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="Tìm kiếm theo tên hoặc email"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" onClick={handleSearch}>Tìm kiếm</Button>
        </Space>
        
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showAddModal}
        >
          Thêm người dùng
        </Button>
      </div>
      
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content' }}
      />
      
      {/* Modal thêm/sửa người dùng */}
      <Modal
        title={modalMode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        forceRender
      >
        <Form
          form={form}
          name="userForm"
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>
          
          {modalMode === 'add' && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          
          <Form.Item
            name="usertype"
            label="Loại tài khoản"
            initialValue="user"
          >
            <Select>
              <Option value="user">Người dùng</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="active"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch 
              checkedChildren="Hoạt động" 
              unCheckedChildren="Vô hiệu" 
            />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                {modalMode === 'add' ? 'Thêm' : 'Cập nhật'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal nạp tiền */}
      <Modal
        title={`Nạp tiền cho ${selectedUser?.username || ''}`}
        open={isAddCreditsModalOpen}
        onCancel={handleCancel}
        footer={null}
        forceRender
      >
        <Form
          form={addCreditsForm}
          name="addCreditsForm"
          layout="vertical"
          onFinish={handleAddCredits}
        >
          <Form.Item
            name="amount"
            label="Số tiền nạp"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Nạp tiền
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal trừ tiền */}
      <Modal
        title={`Trừ tiền từ ${selectedUser?.username || ''}`}
        open={isDeductCreditsModalOpen}
        onCancel={handleCancel}
        footer={null}
        forceRender
      >
        <Form
          form={deductCreditsForm}
          name="deductCreditsForm"
          layout="vertical"
          onFinish={handleDeductCredits}
        >
          <Form.Item
            name="amount"
            label="Số tiền trừ"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button 
                type="primary" 
                danger 
                htmlType="submit"
              >
                Trừ tiền
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal reset mật khẩu */}
      <Modal
        title={`Đặt lại mật khẩu cho ${selectedUser?.username || ''}`}
        open={isResetPasswordModalOpen}
        onCancel={handleCancel}
        footer={null}
        forceRender
      >
        <Form
          form={resetPasswordForm}
          name="resetPasswordForm"
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="new_password"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  
                  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                  const hasUpperCase = /[A-Z]/.test(value);
                  const hasLowerCase = /[a-z]/.test(value);
                  const hasDigit = /\d/.test(value);
                  
                  if (!hasSpecialChar || !hasUpperCase || !hasLowerCase || !hasDigit) {
                    return Promise.reject('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt');
                  }
                  
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="confirm_password"
            label="Xác nhận mật khẩu"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject('Hai mật khẩu không khớp');
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Đặt lại mật khẩu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 