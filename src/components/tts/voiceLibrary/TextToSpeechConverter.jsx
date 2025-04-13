import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { voiceTtsService, vocabularyService, voiceProfileService } from '../../../services/voiceLibraryService';

const TextToSpeechConverter = ({ profiles, userId }) => {
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [availableWords, setAvailableWords] = useState([]);
  const [missingWords, setMissingWords] = useState([]);
  const [profileDetail, setProfileDetail] = useState(null);
  
  const audioRef = useRef(null);
  
  // Khi profile được chọn, tải danh sách từ vựng có sẵn
  useEffect(() => {
    if (selectedProfileId) {
      loadVocabularies();
    } else {
      setAvailableWords([]);
      setMissingWords([]);
      setProfileDetail(null);
    }
  }, [selectedProfileId]);
  
  // Khi text thay đổi, kiểm tra từ nào thiếu
  useEffect(() => {
    checkMissingWords();
  }, [text, availableWords]);
  
  // Tải danh sách từ vựng
  const loadVocabularies = async () => {
    if (!selectedProfileId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Lấy thông tin chi tiết profile
      const profileData = await voiceProfileService.getProfileDetail(selectedProfileId, userId);
      setProfileDetail(profileData);
      
      // Lấy danh sách từ vựng (tất cả từ vựng với limit cao)
      const result = await vocabularyService.getVocabularies(selectedProfileId, userId, 1, 1000);
      const words = result.data.map(vocab => vocab.word.toLowerCase());
      setAvailableWords(words);
    } catch (err) {
      setError('Không thể tải danh sách từ vựng. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Kiểm tra từ nào thiếu
  const checkMissingWords = () => {
    if (!text.trim() || !availableWords.length) {
      setMissingWords([]);
      return;
    }
    
    // Chuẩn hóa văn bản: chuyển thành chữ thường và xử lý dấu câu
    let processedText = text.toLowerCase().trim();
    
    // Thêm khoảng trắng trước dấu câu để tách riêng
    for (const punct of [',', '.', '?', '!', ':', ';']) {
      processedText = processedText.replace(punct, ` ${punct}`);
    }
    
    // Tách từ và loại bỏ khoảng trắng thừa
    const words = processedText.split(/\s+/).filter(word => word.trim() !== '');
    
    // Tìm các từ thiếu
    const missing = words.filter(word => !availableWords.includes(word));
    
    // Loại bỏ trùng lặp
    setMissingWords([...new Set(missing)]);
    
    console.log('Các từ trong văn bản:', words);
    console.log('Các từ đã có:', availableWords);
    console.log('Các từ bị thiếu:', missing);
  };
  
  // Xử lý convert
  const handleConvert = async () => {
    if (!selectedProfileId || !text.trim()) {
      setError('Vui lòng chọn profile và nhập văn bản.');
      return;
    }
    
    if (missingWords.length > 0) {
      setError(`Không thể chuyển đổi vì thiếu các từ: ${missingWords.join(', ')}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = await voiceTtsService.textToSpeech(selectedProfileId, userId, text.trim());
      setAudioUrl(url);
      
      // Tự động phát khi đã convert xong
      if (audioRef.current) {
        setTimeout(() => {
          audioRef.current.play();
        }, 500);
      }
    } catch (err) {
      console.error('Chi tiết lỗi TTS:', err);
      
      let errorMessage = 'Không thể chuyển đổi văn bản thành giọng nói.';
      
      // Xử lý thông báo lỗi chi tiết từ server
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          // Xử lý lỗi thiếu từ trong vocabulary
          if (err.response.data.detail.includes('Các từ sau chưa có trong vocabulary')) {
            const missingWordsMatch = err.response.data.detail.match(/Các từ sau chưa có trong vocabulary: (.+)/);
            if (missingWordsMatch && missingWordsMatch[1]) {
              const missingWords = missingWordsMatch[1].split(', ');
              errorMessage = `Các từ sau chưa có trong thư viện: ${missingWordsMatch[1]}`;
              
              // Cập nhật danh sách từ bị thiếu để hiển thị
              setMissingWords(missingWords);
            } else {
              errorMessage = err.response.data.detail;
            }
          }
          // Xử lý lỗi không tìm thấy file audio
          else if (err.response.data.detail.includes('File audio cho từ')) {
            const wordMatch = err.response.data.detail.match(/File audio cho từ '(.+)' không tồn tại/);
            if (wordMatch && wordMatch[1]) {
              errorMessage = `File âm thanh cho từ '${wordMatch[1]}' không tồn tại. Vui lòng ghi âm lại từ này.`;
            } else {
              errorMessage = err.response.data.detail;
            }
          }
          // Các lỗi khác
          else {
            errorMessage = err.response.data.detail;
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="text-to-speech-converter">
      <h5 className="mb-4">Chuyển đổi văn bản thành giọng nói</h5>
      
      {/* Hiển thị thông báo lỗi */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Card className="p-3 mb-4">
        <Form>
          <Form.Group className="mb-3" controlId="profileSelect">
            <Form.Label>Chọn profile giọng nói</Form.Label>
            <Form.Select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Chọn profile --</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          {profileDetail && (
            <div className="mb-3 p-2 bg-light rounded">
              <p className="mb-1"><strong>Profile:</strong> {profileDetail.name}</p>
              <p className="mb-1"><strong>Số từ đã ghi âm:</strong> {availableWords.length} từ</p>
              {profileDetail.description && (
                <p className="mb-0"><strong>Mô tả:</strong> {profileDetail.description}</p>
              )}
            </div>
          )}
          
          <Form.Group className="mb-3" controlId="textInput">
            <Form.Label>Văn bản cần chuyển đổi</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Nhập văn bản cần chuyển đổi thành giọng nói"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Nhập văn bản chỉ sử dụng các từ đã được ghi âm trong profile.
            </Form.Text>
          </Form.Group>
          
          {/* Hiển thị danh sách từ bị thiếu */}
          {missingWords.length > 0 && (
            <Alert variant="warning" className="mb-3">
              <strong>Từ chưa có trong thư viện:</strong> {missingWords.join(', ')}
              <div className="mt-2">
                <small>Bạn cần thêm các từ này vào thư viện trước khi chuyển đổi.</small>
              </div>
            </Alert>
          )}
          
          <Button
            variant="primary"
            onClick={handleConvert}
            disabled={loading || !selectedProfileId || !text.trim() || missingWords.length > 0}
            className="w-100"
          >
            {loading ? (
              <><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</>
            ) : (
              <>Chuyển đổi thành giọng nói</>
            )}
          </Button>
        </Form>
      </Card>
      
      {/* Audio player */}
      {audioUrl && (
        <Card className="p-3">
          <h6>Kết quả</h6>
          <audio ref={audioRef} controls src={audioUrl} className="w-100 mt-2"></audio>
          <div className="d-flex justify-content-center mt-3">
            <Button
              variant="outline-secondary"
              href={audioUrl}
              download="voice_tts_output.wav"
              className="me-2"
            >
              <i className="bi bi-download me-1"></i> Tải xuống
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => audioRef.current.play()}
            >
              <i className="bi bi-play-circle me-1"></i> Phát lại
            </Button>
          </div>
        </Card>
      )}
      
      {/* Hướng dẫn */}
      <Card className="p-3 mt-4 bg-light">
        <h6>Hướng dẫn sử dụng:</h6>
        <ol className="small mb-0">
          <li>Chọn profile giọng nói đã tạo từ menu dropdown.</li>
          <li>Nhập văn bản cần chuyển đổi. Chỉ sử dụng các từ đã có trong thư viện.</li>
          <li>Nhấn nút "Chuyển đổi thành giọng nói" để tạo âm thanh.</li>
          <li>Hệ thống sẽ tự động cắt giảm khoảng lặng và ghép mượt mà các từ lại với nhau.</li>
          <li>Nghe kết quả và tải xuống nếu cần.</li>
        </ol>
      </Card>
    </div>
  );
};

export default TextToSpeechConverter; 