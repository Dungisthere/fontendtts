import { useState, useEffect } from 'react';
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
  Select,
  Radio
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
const { Option } = Select;

// Ánh xạ ID giọng với tên thân thiện người dùng
const voiceNameMapping = {
  "speechify_1": "Giọng Nam 1",
  "speechify_2": "Giọng Nam (Trung tính)",
  "speechify_3": "Giọng Nam 2",
  "speechify_4": "Giọng Nam 3",
  "speechify_5": "Giọng Nam cợt nhả 1",
  "speechify_6": "Giọng Nam 5",
  "speechify_7": "Giọng Nam 6",
  "speechify_8": "Giọng Nam 7",
  "speechify_9": "Giọng Nữ 1 (Dịu dàng)",
  "speechify_10": "Giọng Nam 8 (Review)",
  "speechify_11": "Giọng Nữ 2( Khuyên dùng)",
  "speechify_12": "Giọng Nam 9",
  "cdteam": "Giọng Nam 10",
  "nguyen-ngoc-ngan": "Giọng Nguyễn Ngọc Ngạn",
  "son-tung-mtp": "Giọng Sơn Tùng MTP",
  "diep-chi": "Giọng Nữ 5 (Diệp Chi)",
  "nu-nhe-nhang": "Giọng Nữ Nhẹ Nhàng",
  "quynh": "Giọng Nữ 4 (Quỳnh)",
  "nsnd-le-chuc": "Giọng NSND Lê Chức",
  "doremon": "Giọng Doremon",
  "jack-sparrow": "Giọng Jack Sparrow",
  "zero_shot_prompt": "Giọng Nữ 3 (vui nhộn)",
  "cross_lingual_prompt": "Giọng Nam (cợt nhả 2)"
};

const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedModel, setSelectedModel] = useState('model_old');
  const [speed, setSpeed] = useState('normal');
  const [vietTTSVoices, setVietTTSVoices] = useState([]);
  const [selectedVietTTSVoice, setSelectedVietTTSVoice] = useState('cdteam');
  const { user } = useSelector((state) => state.auth);

  // Tải danh sách giọng nói VietTTS khi component được render
  useEffect(() => {
    const loadVietTTSVoices = async () => {
      try {
        const voices = await ttsService.getVietTTSVoices();
        setVietTTSVoices(voices);
        console.log('Loaded VietTTS voices:', voices);
      } catch (error) {
        console.error('Failed to load VietTTS voices:', error);
        message.error('Không thể tải danh sách giọng nói VietTTS');
      }
    };
    
    loadVietTTSVoices();
  }, []);

  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      message.error('Vui lòng nhập văn bản để chuyển thành giọng nói!');
      return;
    }

    setLoading(true);
    try {
      let url;
      
      if (selectedModel === 'model_old') {
        // Sử dụng model cũ
        const response = await ttsService.generateSpeech(text);
        
        // Log để debug
        console.log('Response status:', response.status);
        
        // Tạo URL từ blob
        const audioBlob = response.data;
        url = URL.createObjectURL(audioBlob);
      } else if (selectedModel === 'model_new') {
        // Gọi API TTS (đã yêu cầu header X-API-KEY)
        const apiUrl =
          `http://localhost:5004/tts?text=${encodeURIComponent(text)}&speed=${encodeURIComponent(speed)}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-API-KEY': 'model1voice'    // <<-- thêm khóa ở đây
          }
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `TTS request failed (${response.status})`);
        }

        const data = await response.json();
        console.log('Model mới response:', data);

        // Sử dụng audio_url từ phản hồi
        url = data.audio_url;
    } else if (selectedModel === 'viet_tts') {
        // Sử dụng VietTTS API
        const response = await ttsService.generateVietTTSSpeech(text, selectedVietTTSVoice);
        console.log('VietTTS Response status:', response.status);
        
        // Tạo URL từ blob
        const audioBlob = response.data;
        url = URL.createObjectURL(audioBlob);
      }
      
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
            <p>Hiện có 3 model text-to-speech:</p>
            <ul>
              <li><strong>Model</strong> facebook/mms-tts-vie (không hỗ trợ tùy chỉnh tốc độ)</li>
              <li><strong>Model</strong> vits-vietnamese (hỗ trợ tùy chỉnh tốc độ)</li>
              <li><strong>Model</strong> VietTTS (hỗ trợ nhiều giọng đọc Tiếng Việt)</li>
            </ul>
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
              
              {/* Phần chọn model */}
              <div style={{ marginBottom: '15px' }}>
                <Text strong style={{ marginBottom: '10px', display: 'block' }}>Chọn Model:</Text>
                <Radio.Group 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio value="model_old">Model (facebook/mms-tts-vie)</Radio>
                    <Radio value="model_new">Model (vits-vietnamese)</Radio>
                    <Radio value="viet_tts">Model (VietTTS)</Radio>
                  </Space>
                </Radio.Group>
              </div>
              
              {/* Phần chọn tốc độ (chỉ hiển thị khi chọn model mới) */}
              {selectedModel === 'model_new' && (
                <div style={{ marginBottom: '15px' }}>
                  <Text strong style={{ marginBottom: '10px', display: 'block' }}>Tốc độ:</Text>
                  <Select
                    value={speed}
                    onChange={(value) => setSpeed(value)}
                    style={{ width: '100%' }}
                  >
                    <Option value="slow">Chậm</Option>
                    <Option value="normal">Chuẩn</Option>
                    <Option value="fast">Nhanh</Option>
                    <Option value="very_fast">Rất nhanh</Option>
                  </Select>
                </div>
              )}

              {/* Phần chọn giọng đọc (chỉ hiển thị khi chọn VietTTS) */}
              {selectedModel === 'viet_tts' && (
                <div style={{ marginBottom: '15px' }}>
                  <Text strong style={{ marginBottom: '10px', display: 'block' }}>Giọng đọc:</Text>
                  <Select
                    value={selectedVietTTSVoice}
                    onChange={(value) => setSelectedVietTTSVoice(value)}
                    style={{ width: '100%' }}
                    placeholder="Chọn giọng đọc"
                    loading={vietTTSVoices.length === 0}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {vietTTSVoices.map(voice => (
                      <Option key={voice} value={voice}>
                        {voiceNameMapping[voice] || voice}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}

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
                  maxLength={5000}
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
                      value={selectedModel === 'model_old' ? 'facebook/mms-tts-vie' : selectedModel === 'model_new' ? 'vits-vietnamese' : 'VietTTS'} 
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </Col>
                  {selectedModel === 'model_new' && (
                    <Col span={24} style={{ paddingLeft: 0 }}>
                      <Statistic 
                        title="Tốc độ" 
                        value={speed === 'normal' ? 'Chuẩn' : 
                              speed === 'fast' ? 'Nhanh' : 
                              speed === 'slow' ? 'Chậm' : 
                              speed === 'very_fast' ? 'Rất nhanh' : 'Rất chậm'} 
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                  )}
                  {selectedModel === 'viet_tts' && (
                    <Col span={24} style={{ paddingLeft: 0 }}>
                      <Statistic 
                        title="Giọng đọc" 
                        value={voiceNameMapping[selectedVietTTSVoice] || selectedVietTTSVoice} 
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                  )}
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