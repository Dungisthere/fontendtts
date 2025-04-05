import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Typography, Select, Form, Spin, message, Popconfirm } from 'antd';
import { 
  UserOutlined, 
  KeyOutlined, 
  SaveOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { adminService } from '../../services/adminApi';

const { Title } = Typography;
const { Option } = Select;

const Roles = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editingKey, setEditingKey] = useState('');
  
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Gọi API thực để lấy danh sách người dùng
      const response = await adminService.getUsers();
      setUsers(response);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      message.error('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const isEditing = (record) => record.id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({
      usertype: record.usertype,
    });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (record) => {
    try {
      const row = await form.validateFields();
      
      // Nếu không thay đổi, không cần lưu
      if (row.usertype === record.usertype) {
        setEditingKey('');
        return;
      }
      
      setLoading(true);
      // Gọi API thực để thay đổi quyền người dùng
      await adminService.changeUserType(record.id, row.usertype);
      
      // Cập nhật state sau khi API thành công
      const newData = [...users];
      const index = newData.findIndex(item => record.id === item.id);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          usertype: row.usertype,
        });
        setUsers(newData);
        message.success(`Đã thay đổi quyền cho người dùng ${record.username} thành ${row.usertype === 'admin' ? 'quản trị viên' : 'người dùng thường'}`);
      }
      setEditingKey('');
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi lưu thay đổi:', error);
      message.error('Không thể thay đổi quyền người dùng. Vui lòng thử lại sau.');
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
      editable: true,
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Form.Item
            name="usertype"
            style={{ margin: 0 }}
            rules={[{ required: true, message: 'Vui lòng chọn loại tài khoản!' }]}
          >
            <Select>
              <Option value="user">Người dùng</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>
        ) : (
          <Tag color={record.usertype === 'admin' ? 'blue' : 'default'}>
            {record.usertype === 'admin' ? 'Quản trị viên' : 'Người dùng'}
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={() => save(record)}
              size="small"
            >
              Lưu
            </Button>
            <Popconfirm 
              title="Bạn có chắc chắn muốn hủy?" 
              onConfirm={cancel}
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            >
              <Button size="small">Hủy</Button>
            </Popconfirm>
          </Space>
        ) : (
          <Button 
            type="primary" 
            icon={<KeyOutlined />}
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            size="small"
          >
            Đổi quyền
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Phân quyền người dùng</Title>
      
      <Form form={form} component={false}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Form>
    </div>
  );
};

export default Roles; 