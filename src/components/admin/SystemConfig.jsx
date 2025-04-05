import { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Upload, message, Spin, 
  Divider, Typography, Row, Col, Image, notification, Result
} from 'antd';
import { UploadOutlined, SaveOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { configService } from '../../services/api';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

const SystemConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  useEffect(() => {
    // Lấy cấu hình khi component được khởi tạo
    fetchConfig();
  }, []);
  
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const config = await configService.getConfig();
      // Cập nhật form với dữ liệu từ server
      form.setFieldsValue({
        website_name: config.website_name,
        website_url: config.website_url,
        phone_1: config.phone_1,
        phone_2: config.phone_2,
        email: config.email
      });
      
      // Hiển thị logo nếu có
      if (config.logo_base64) {
        setLogoPreview(config.logo_base64);
      }
    } catch (error) {
      message.error('Không thể lấy thông tin cấu hình: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (values) => {
    setSaving(true);
    console.log('Bắt đầu lưu cấu hình:', values);
    try {
      // Thêm logo_base64 vào values nếu có
      if (logoPreview) {
        values.logo_base64 = logoPreview;
      }
      
      const result = await configService.updateConfig(values);
      console.log('Kết quả cập nhật:', result);
      
      // Hiển thị thông báo với cả hai phương thức
      message.destroy(); // Xóa thông báo hiện tại nếu có
      
      // Sử dụng notification API
      notification.destroy(); // Xóa notification hiện tại nếu có
      notification.success({
        message: 'Cập nhật thành công',
        description: 'Thông tin cấu hình hệ thống đã được cập nhật thành công.',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 6, // Tăng thời gian hiển thị
        placement: 'top', // Thay đổi vị trí sang giữa trên cùng
      });
      
      // Thêm một timeout ngắn trước khi hiển thị message
      setTimeout(() => {
        message.success({
          content: 'Cập nhật cấu hình thành công!',
          duration: 5,
          style: {
            marginTop: '20vh',
          },
        });
      }, 300);
      
      // Hiển thị kết quả thành công
      setUpdateSuccess(true);
      
      // Tự động ẩn kết quả sau 5 giây
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 5000);
      
    } catch (error) {
      console.error('Lỗi khi cập nhật cấu hình:', error);
      message.error('Lỗi khi cập nhật cấu hình: ' + (error.message || 'Đã xảy ra lỗi không xác định'));
    } finally {
      setSaving(false);
    }
  };
  
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ chấp nhận file hình ảnh!');
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Kích thước hình ảnh phải nhỏ hơn 2MB!');
    }
    
    return isImage && isLt2M;
  };
  
  const handleLogoChange = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    
    if (info.file.status === 'done') {
      // Đọc file thành base64
      const reader = new FileReader();
      reader.readAsDataURL(info.file.originFileObj);
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
    }
  };
  
  const customUploadRequest = ({ onSuccess }) => {
    // Giả lập quá trình upload thành công
    setTimeout(() => {
      onSuccess();
    }, 0);
  };

  return (
    <Card title="Cài đặt hệ thống" style={{ width: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
      <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
        {updateSuccess && (
          <Result
            status="success"
            title="Cập nhật cấu hình thành công!"
            subTitle="Các thay đổi của bạn đã được lưu và áp dụng vào hệ thống."
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Title level={4}>Thông tin website</Title>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="website_name"
                label="Tên website"
                rules={[{ required: true, message: 'Vui lòng nhập tên website!' }]}
              >
                <Input placeholder="Nhập tên website" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="website_url"
                label="URL website"
                rules={[{ required: true, message: 'Vui lòng nhập URL website!' }]}
              >
                <Input placeholder="Nhập URL website" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="Logo website"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logoPreview && (
                <div style={{ marginBottom: '10px' }}>
                  <Text strong>Logo hiện tại:</Text>
                  <div style={{ marginTop: '5px', border: '1px solid #f0f0f0', padding: '10px', display: 'inline-block' }}>
                    <Image
                      src={logoPreview}
                      alt="Logo website"
                      style={{ maxHeight: '100px', maxWidth: '300px' }}
                    />
                  </div>
                </div>
              )}
              
              <Upload
                name="logo"
                listType="picture"
                maxCount={1}
                beforeUpload={beforeUpload}
                onChange={handleLogoChange}
                customRequest={customUploadRequest}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Tải lên logo mới</Button>
              </Upload>
              <Text type="secondary">Hỗ trợ JPG, PNG, WebP. Kích thước tối đa 2MB.</Text>
            </div>
          </Form.Item>
          
          <Divider />
          
          <Title level={4}>Thông tin liên hệ</Title>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="phone_1"
                label="Số điện thoại 1"
              >
                <Input placeholder="Nhập số điện thoại 1" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="phone_2"
                label="Số điện thoại 2"
              >
                <Input placeholder="Nhập số điện thoại 2" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="email"
            label="Email liên hệ"
            rules={[
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập email liên hệ" />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              size="large"
              onClick={() => {
                console.log('Nút Lưu cấu hình được nhấn');
                // Kích hoạt validate form trước khi submit
                form.validateFields()
                  .then(values => {
                    console.log('Form validation thành công:', values);
                    toast.success('Cập nhật thành công');
                    handleSubmit(values);
                  })
                  .catch(errorInfo => {
                    console.log('Form validation thất bại:', errorInfo);
                  });
              }}
            >
              Lưu cấu hình
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
};

export default SystemConfig; 