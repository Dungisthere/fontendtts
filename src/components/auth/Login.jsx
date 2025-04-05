import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../redux/authSlice';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      // Đảm bảo toast hiển thị khi có lỗi
      toast.error(error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      console.log("Hiển thị toast lỗi:", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (user) {
      toast.success('Đăng nhập thành công!');
      navigate('/tts');
    }
  }, [user, navigate]);

  const onFinish = async (values) => {
    console.log("Bắt đầu đăng nhập với:", values);
    dispatch(loginUser({
      username: values.username,
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
              <LoginOutlined style={{ marginRight: 10 }} />
              Đăng Nhập
            </Title>
            <Text type="secondary">Chào mừng bạn đến với ứng dụng TTS</Text>
          </div>
          
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
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
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#1890ff' }} />} 
                placeholder="Mật khẩu"
                autoComplete="current-password"
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
                Đăng Nhập
              </Button>
            </Form.Item>
          </Form>
          
          <Divider>
            <Text type="secondary">Hoặc</Text>
          </Divider>
          
          <div style={{ textAlign: 'center' }}>
            <Text>
              Chưa có tài khoản? {' '}
              <Link to="/register" style={{ fontWeight: 'bold', color: '#1890ff' }}>
                Đăng ký ngay
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login; 