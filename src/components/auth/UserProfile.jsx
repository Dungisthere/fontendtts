import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Space, Divider, Row, Col, Typography, Spin } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SaveOutlined, KeyOutlined } from '@ant-design/icons';
import { updateUserProfile, clearError, clearUpdateSuccess, changePassword, clearPasswordChangeSuccess } from '../../redux/authSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Auth.css';

const { Title, Text } = Typography;

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error, updateSuccess, passwordChangeSuccess } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      // Đặt giá trị mặc định cho form từ thông tin user
      form.setFieldsValue({
        username: user.username,
        email: user.email
      });
    }
  }, [user, navigate, form]);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    
    if (updateSuccess) {
      toast.success('Cập nhật thông tin tài khoản thành công!');
      dispatch(clearUpdateSuccess());
    }
    
    if (passwordChangeSuccess) {
      toast.success('Đổi mật khẩu thành công!');
      dispatch(clearPasswordChangeSuccess());
      passwordForm.resetFields();
      setIsChangingPassword(false);
    }
  }, [error, updateSuccess, passwordChangeSuccess, dispatch, passwordForm]);
  
  const handleProfileUpdate = (values) => {
    if (!user) return;
    
    dispatch(updateUserProfile({
      userId: user.id,
      userData: {
        username: values.username,
        email: values.email,
        credits: user.credits,
        usertype: user.usertype,
        active: user.active
      }
    }));
  };
  
  const handlePasswordUpdate = (values) => {
    if (!user) return;
    
    // In ra console để kiểm tra dữ liệu trước khi gửi đi
    console.log('Gửi yêu cầu đổi mật khẩu:');
    console.log('User ID:', user.id);
    console.log('Current Password:', values.currentPassword);
    console.log('New Password:', values.newPassword);
    
    // Sử dụng API đổi mật khẩu mới
    dispatch(changePassword({
      userId: user.id,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword
    }));
  };
  
  if (!user) {
    return <Spin size="large" />;
  }
  
  return (
    <div className="auth-container profile-container">
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={14} xl={12}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
            Thông tin tài khoản
          </Title>
          
          <Card className="auth-card">
            <Form
              form={form}
              name="userProfile"
              layout="vertical"
              initialValues={{
                username: user.username,
                email: user.email
              }}
              onFinish={handleProfileUpdate}
            >
              <Form.Item
                name="username"
                label="Tên người dùng"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên người dùng!' },
                  { min: 3, message: 'Tên người dùng phải có ít nhất 3 ký tự!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Tên người dùng" 
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="Email" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="auth-button" 
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  Cập nhật thông tin
                </Button>
              </Form.Item>
            </Form>
            
            <Divider orientation="left">Đổi mật khẩu</Divider>
            
            <Form
              form={passwordForm}
              name="passwordChange"
              layout="vertical"
              onFinish={handlePasswordUpdate}
            >
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Mật khẩu hiện tại" 
                />
              </Form.Item>
              
              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      
                      const hasUpperCase = /[A-Z]/.test(value);
                      const hasLowerCase = /[a-z]/.test(value);
                      const hasNumber = /[0-9]/.test(value);
                      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
                      
                      if (!hasUpperCase) {
                        return Promise.reject('Mật khẩu phải chứa ít nhất 1 chữ hoa!');
                      }
                      if (!hasLowerCase) {
                        return Promise.reject('Mật khẩu phải chứa ít nhất 1 chữ thường!');
                      }
                      if (!hasNumber) {
                        return Promise.reject('Mật khẩu phải chứa ít nhất 1 chữ số!');
                      }
                      if (!hasSpecialChar) {
                        return Promise.reject('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt!');
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Mật khẩu mới (ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)" 
                />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="Xác nhận mật khẩu mới" 
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="auth-button" 
                  icon={<KeyOutlined />}
                  loading={loading}
                  onClick={() => setIsChangingPassword(true)}
                >
                  Đổi mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <div className="auth-footer">
            <Space>
              <Button type="link" onClick={() => navigate('/tts')}>
                Quay lại trang chủ
              </Button>
            </Space>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile; 