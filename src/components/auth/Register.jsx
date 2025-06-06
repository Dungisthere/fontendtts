import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError, clearRegisterSuccess } from '../../redux/authSlice';
import { toast } from 'react-toastify';
import './Auth.css';

const { Title, Text } = Typography;

const Register = () => {
  const dispatch = useDispatch();
  const { loading, error, registerSuccess } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (registerSuccess) {
      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      dispatch(clearRegisterSuccess());
      navigate('/login');
    }
  }, [registerSuccess, dispatch, navigate]);

  const onFinish = (values) => {
    if (values.password !== values.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    setConfirmPasswordError('');
    
    dispatch(registerUser({
      username: values.username,
      email: values.email,
      password: values.password
    }));
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '450px', padding: '0 20px' }}>
        <Card 
          style={{ 
            width: '100%',
            borderRadius: 15, 
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }}
          bodyStyle={{ padding: '40px 30px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              <UserAddOutlined style={{ marginRight: 10 }} />
              Đăng Ký Tài Khoản
            </Title>
            <Text type="secondary">Tạo tài khoản mới để sử dụng dịch vụ TTS</Text>
          </div>
          
          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            scrollToFirstError
            style={{ width: '100%' }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: '#1890ff' }} />} 
                placeholder="Tên đăng nhập"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#1890ff' }} />} 
                placeholder="Email"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    
                    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                    const hasUpperCase = /[A-Z]/.test(value);
                    const hasLowerCase = /[a-z]/.test(value);
                    
                    if (!hasSpecialChar) {
                      return Promise.reject('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
                    }
                    if (!hasUpperCase) {
                      return Promise.reject('Mật khẩu phải có ít nhất 1 chữ hoa');
                    }
                    if (!hasLowerCase) {
                      return Promise.reject('Mật khẩu phải có ít nhất 1 chữ thường');
                    }
                    
                    return Promise.resolve();
                  }
                }
              ]}
              hasFeedback
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#1890ff' }} />} 
                placeholder="Mật khẩu"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#1890ff' }} />} 
                placeholder="Xác nhận mật khẩu"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                style={{ height: '46px', borderRadius: '8px', fontSize: '16px' }}
              >
                Đăng Ký
              </Button>
            </Form.Item>
          </Form>
          
          <Divider>
            <Text type="secondary">Hoặc</Text>
          </Divider>
          
          <div style={{ textAlign: 'center' }}>
            <Text>
              Đã có tài khoản? {' '}
              <Link to="/login" style={{ fontWeight: 'bold', color: '#1890ff' }}>
                Đăng nhập
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register; 