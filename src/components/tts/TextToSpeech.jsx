import { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Typography, 
  message, 
  Space, 
  Row, 
  Col, 
  Statistic, 
  Divider,
  Spin,
  Alert,
} from 'antd';
import { 
  SoundOutlined, 
  LoadingOutlined, 
  DownloadOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined,
  StarOutlined, 
  StarFilled
} from '@ant-design/icons';
import { ttsService } from '../../services/api';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { TextArea } = Input;

const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      message.error('Vui lòng nhập văn bản để chuyển thành giọng nói!');
      return;
    }

    setLoading(true);
    try {
      // Bây giờ ttsService.generateSpeech trả về response hoàn chỉnh
      const response = await ttsService.generateSpeech(text);
      
      // Log để debug
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is Blob:', response.data instanceof Blob);
      
      // response.data bây giờ là Blob
      const audioBlob = response.data;
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      message.success('Đã tạo giọng nói thành công!');
    } catch (error) {
      console.error('TTS error:', error);
      message.error('Không thể chuyển đổi văn bản thành giọng nói. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    message.success(isFavorite ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Thông báo tính năng */}
      <Alert
        message="Thông tin về model"
        description={
          <div>
            <p>Model hiện tại: <strong>facebook/mms-tts-vie</strong></p>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24, width: '100%' }}
      />
      
      <Row gutter={[24, 24]} style={{ width: '100%', margin: 0 }}>
        <Col xs={24} lg={16} style={{ width: '100%', paddingLeft: 0, paddingRight: 12 }}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <SoundOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: '10px' }} />
                <Text strong style={{ fontSize: '18px' }}>Chuyển Văn Bản Thành Giọng Nói</Text>
              </div>
            }
            bordered={false}
            style={{ 
              width: '100%',
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              height: '100%'
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', width: '100%' }}>
                  <Text strong>Nhập văn bản:</Text>
                  <Text type="secondary">{text.length} ký tự</Text>
                </div>
                
                <TextArea
                  rows={10}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập văn bản mà bạn muốn chuyển thành giọng nói..."
                  maxLength={1000}
                  showCount
                  style={{ 
                    width: '100%',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    resize: 'none' 
                  }}
                />
              </div>

              <Button
                type="primary"
                icon={loading ? <LoadingOutlined /> : <SoundOutlined />}
                onClick={handleGenerateSpeech}
                loading={loading}
                block
                size="large"
                style={{ 
                  width: '100%',
                  height: '50px', 
                  borderRadius: '8px', 
                  fontSize: '16px',
                  marginTop: '10px'
                }}
              >
                {loading ? 'Đang xử lý...' : 'Tạo Giọng Nói'}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8} style={{ width: '100%', paddingLeft: 12, paddingRight: 0 }}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <PlayCircleOutlined style={{ fontSize: '20px', color: '#1890ff', marginRight: '10px' }} />
                <Text strong style={{ fontSize: '18px' }}>Kết Quả</Text>
              </div>
            }
            bordered={false}
            style={{ 
              width: '100%',
              borderRadius: '12px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              height: '100%'
            }}
          >
            {audioUrl ? (
              <div style={{ width: '100%' }}>
                <div style={{ 
                  width: '100%',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '15px'
                }}>
                  <Text>audio.wav</Text>
                  <Button 
                    type="text"
                    icon={isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={toggleFavorite}
                  />
                </div>
                
                <div style={{ 
                  width: '100%',
                  background: '#f5f5f5', 
                  borderRadius: '8px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <audio
                    controls
                    src={audioUrl}
                    style={{ width: '100%', marginBottom: '10px' }}
                  >
                    Trình duyệt của bạn không hỗ trợ phát âm thanh.
                  </audio>
                  
                  <Button
                    icon={<DownloadOutlined />}
                    href={audioUrl}
                    download="audio.wav"
                    type="primary"
                    style={{ marginTop: '10px' }}
                  >
                    Tải xuống
                  </Button>
                </div>
                
                <Divider style={{ margin: '15px 0', width: '100%' }}>
                  <Text type="secondary">Thông tin</Text>
                </Divider>
                
                <Row gutter={[8, 8]} style={{ width: '100%', margin: 0 }}>
                  <Col span={24} style={{ paddingLeft: 0 }}>
                    <Statistic 
                      title="Model" 
                      value="facebook/mms-tts-vie" 
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                </Row>
              </div>
            ) : (
              <div style={{ 
                width: '100%',
                height: '250px', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                color: '#bfbfbf'
              }}>
                {loading ? (
                  <Spin tip="Đang tạo giọng nói..." />
                ) : (
                  <>
                    <SoundOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <Text type="secondary">
                      Nhập văn bản và nhấn "Tạo Giọng Nói" để nghe kết quả
                    </Text>
                  </>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TextToSpeech; 