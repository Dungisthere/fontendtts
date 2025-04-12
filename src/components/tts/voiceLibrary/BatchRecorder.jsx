import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, Alert, ProgressBar, Modal } from 'react-bootstrap';
import { vocabularyService } from '../../../services/voiceLibraryService';
import './VoiceLibraryStyles.css';

const BatchRecorder = ({ profileId, userId, onComplete }) => {
  const [text, setText] = useState('');
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [existingVocab, setExistingVocab] = useState(null);
  const [existingWords, setExistingWords] = useState([]);
  
  // Refs cho media recorder
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      stopRecording();
    };
  }, []);

  const prepareWordList = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập văn bản để ghi âm');
      return;
    }

    // Tách văn bản thành danh sách từ
    const wordList = text.trim().toLowerCase().split(/\s+/);
    
    // Loại bỏ các từ trùng lặp
    const uniqueWords = [...new Set(wordList)];
    
    if (uniqueWords.length === 0) {
      setError('Không tìm thấy từ nào để ghi âm');
      return;
    }

    // Kiểm tra từng từ xem đã tồn tại chưa
    setLoading(true);
    
    try {
      // Lấy danh sách từ vựng hiện có
      const existingVocabularies = await vocabularyService.getVocabularies(profileId, userId);
      const existingWordsList = existingVocabularies.map(vocab => vocab.word.toLowerCase());
      setExistingWords(existingWordsList);
      
      // Tìm các từ đã tồn tại
      const existingWordsInInput = uniqueWords.filter(word => existingWordsList.includes(word));
      
      // Hiển thị cảnh báo nếu có từ đã tồn tại
      if (existingWordsInInput.length > 0) {
        // Tạo thông báo
        const warningMessage = `
          Các từ sau đã tồn tại trong thư viện và sẽ được ghi đè nếu tiếp tục:
          ${existingWordsInInput.join(', ')}
        `;
        
        const confirmOverwrite = window.confirm(warningMessage + '\n\nBạn có muốn tiếp tục không?');
        if (!confirmOverwrite) {
          setLoading(false);
          return;
        }
      }
      
      setWords(uniqueWords);
      setCurrentWordIndex(-1);
      setProgress(0);
      setShowRecordModal(true);
      
      // Bắt đầu với từ đầu tiên
      setTimeout(() => startNextWord(), 500);
    } catch (error) {
      console.error("Lỗi khi kiểm tra từ vựng:", error);
      setError("Không thể kiểm tra từ vựng đã tồn tại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const startNextWord = () => {
    if (currentWordIndex + 1 >= words.length) {
      // Đã hoàn thành tất cả các từ
      setShowRecordModal(false);
      if (onComplete) onComplete();
      return;
    }

    setCurrentWordIndex(prevIndex => prevIndex + 1);
    setAudioUrl(null);
    setAudioFile(null);
    
    // Không tự động bắt đầu đếm ngược, để người dùng chủ động nhấn nút
  };

  const startCountdown = () => {
    setCountdown(3);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Tạo file từ blob để upload
        const currentWord = words[currentWordIndex];
        const file = new File(
          [audioBlob], 
          `${currentWord.replace(/\s+/g, '_')}.wav`, 
          { type: 'audio/wav' }
        );
        setAudioFile(file);
      };
      
      mediaRecorderRef.current.start();
      setRecording(true);
      
      // Tự động dừng sau 3 giây
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 3000);
    } catch (err) {
      console.error('Không thể truy cập microphone:', err);
      setError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const saveCurrentWord = async (overwrite = false) => {
    if (!audioFile) {
      setError('Vui lòng ghi âm trước khi lưu');
      return;
    }

    const currentWord = words[currentWordIndex];
    setLoading(true);
    setError(null);

    try {
      // Kiểm tra xem từ này đã tồn tại và chưa được xác nhận ghi đè
      const wordExists = existingWords.includes(currentWord.toLowerCase()) && !overwrite;
      
      if (wordExists) {
        // Hiển thị confirmation modal
        setExistingVocab({word: currentWord});
        setShowOverwriteConfirm(true);
        setLoading(false);
        return;
      }
      
      // Tạo FormData và thêm tham số overwrite
      const formData = new FormData();
      formData.append('word', currentWord);
      formData.append('audio_file', audioFile);
      formData.append('overwrite', true); // Sử dụng overwrite=true vì đã xác nhận từ đầu
      
      const result = await vocabularyService.addVocabulary(profileId, userId, formData);
      
      // Cập nhật tiến độ
      setProgress(((currentWordIndex + 1) / words.length) * 100);
      
      // Chuyển đến từ tiếp theo
      startNextWord();
    } catch (err) {
      setError(`Không thể lưu từ "${currentWord}". Vui lòng thử lại.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (window.confirm('Bạn có chắc muốn dừng quá trình ghi âm? Tiến độ sẽ không được lưu.')) {
      setShowRecordModal(false);
      setShowOverwriteConfirm(false);
    }
  };

  const handleConfirmOverwrite = () => {
    setShowOverwriteConfirm(false);
    saveCurrentWord(true);
  };

  return (
    <div className="batch-recorder">
      <Card className="p-3 mb-4">
        <Card.Body>
          <h5 className="mb-3">Ghi âm từng từ theo trình tự</h5>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nhập văn bản cần ghi âm</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Nhập đoạn văn bản có các từ bạn muốn ghi âm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Mỗi từ sẽ được ghi âm một lần, kể cả nếu từ đó xuất hiện nhiều lần trong văn bản.
            </Form.Text>
          </Form.Group>

          <Button 
            variant="primary"
            onClick={prepareWordList}
            disabled={!text.trim() || loading}
          >
            {loading ? 'Đang xử lý...' : 'Bắt đầu ghi âm theo từng từ'}
          </Button>
        </Card.Body>
      </Card>

      {/* Modal ghi âm từng từ */}
      <Modal
        show={showRecordModal}
        onHide={handleCloseModal}
        backdrop="static"
        keyboard={false}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Ghi âm từng từ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentWordIndex >= 0 && currentWordIndex < words.length ? (
            <>
              <div className="text-center mb-3">
                <h3 className="display-4">"{words[currentWordIndex]}"</h3>
                <p className="mb-4">Hãy đọc từ trên với giọng tự nhiên</p>
                
                {countdown > 0 ? (
                  <div className="countdown-display py-4">
                    <h1 className="display-1">{countdown}</h1>
                    <p className="text-muted">Chuẩn bị...</p>
                  </div>
                ) : recording ? (
                  <div className="recording-indicator py-4">
                    <div className="recording-pulse"></div>
                    <p className="mt-3 text-danger">Đang ghi âm...</p>
                  </div>
                ) : audioUrl ? (
                  <div className="recorded-audio py-3">
                    <p>Đã ghi âm xong! Nghe lại:</p>
                    <audio controls src={audioUrl} className="w-100 mb-3"></audio>
                    
                    <div className="d-flex justify-content-center gap-3 mt-3">
                      <Button 
                        variant="outline-secondary"
                        onClick={startCountdown}
                        disabled={loading}
                      >
                        Ghi âm lại
                      </Button>
                      <Button 
                        variant="success"
                        onClick={() => saveCurrentWord()}
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu và tiếp tục'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={startCountdown}
                      disabled={loading}
                    >
                      Bắt đầu ghi âm
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <ProgressBar 
                  now={progress} 
                  label={`${Math.round(progress)}%`}
                  className="mb-2" 
                />
                <p className="text-center">
                  Từ {currentWordIndex + 1} / {words.length}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p>Chuẩn bị ghi âm...</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal xác nhận ghi đè */}
      <Modal
        show={showOverwriteConfirm}
        onHide={() => setShowOverwriteConfirm(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận ghi đè</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {existingVocab && (
            <>
              <p>Từ "<strong>{existingVocab.word}</strong>" đã tồn tại trong thư viện.</p>
              <p>Bạn có muốn ghi đè file âm thanh hiện tại không?</p>
              <div className="d-flex justify-content-center gap-3 mt-3">
                <Button 
                  variant="outline-secondary"
                  onClick={() => {
                    setShowOverwriteConfirm(false);
                    startNextWord(); // Bỏ qua từ này
                  }}
                >
                  Bỏ qua từ này
                </Button>
                <Button 
                  variant="danger"
                  onClick={handleConfirmOverwrite}
                >
                  Ghi đè
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BatchRecorder; 