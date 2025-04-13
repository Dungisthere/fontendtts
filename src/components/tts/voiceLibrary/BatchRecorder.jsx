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
  const [showInput, setShowInput] = useState(false);
  
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

  // Kiểm tra từ vựng đã tồn tại khi component khởi tạo
  useEffect(() => {
    if (words.length > 0) {
      checkExistingVocabularies();
    }
  }, []);  // Chỉ chạy 1 lần khi component mount

  const prepareWordList = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập văn bản để ghi âm');
      return;
    }
    
    setLoading(true);
    try {
      // Tách văn bản thành danh sách từ
      const wordList = text.trim().toLowerCase().split(/\s+/);
      
      // Loại bỏ các từ trùng lặp
      const uniqueWords = [...new Set(wordList)];
      
      if (uniqueWords.length === 0) {
        setError('Không tìm thấy từ nào để ghi âm');
        return;
      }
      
      // Cập nhật danh sách từ
      setWords(uniqueWords.map(word => ({
        word,
        recording: false,
        recorded: false,
        exists: false,
        audioUrl: null
      })));
      
      // Kiểm tra các từ đã tồn tại
      await checkExistingVocabularies();
      
      // Chuyển sang từ đầu tiên
      setCurrentWordIndex(0);
      setProgress(0);
      
      // Hiển thị modal ghi âm
      setShowRecordModal(true);
    } catch (error) {
      console.error("Lỗi khi chuẩn bị danh sách từ vựng:", error);
      setError("Không thể chuẩn bị danh sách từ vựng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const startNextWord = () => {
    if (currentWordIndex + 1 >= words.length) {
      // Đã hoàn thành tất cả các từ
      setShowRecordModal(false);
      setError(null);
      setText(''); // Làm trống ô văn bản sau khi hoàn thành
      
      // Thông báo hoàn thành
      if (onComplete) {
        onComplete();
      }
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
      // Đảm bảo dừng bất kỳ recording nào đang hoạt động
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
      
      // Yêu cầu quyền truy cập microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Khởi tạo MediaRecorder với stream mới
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      // Xử lý sự kiện dataavailable
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      // Xử lý sự kiện khi dừng recording
      mediaRecorderRef.current.onstop = () => {
        try {
          // Kiểm tra xem có dữ liệu âm thanh không
          if (audioChunksRef.current.length === 0) {
            setError('Không có dữ liệu âm thanh được ghi. Vui lòng thử lại.');
            return;
          }
          
          // Tạo Blob âm thanh
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          if (audioBlob.size === 0) {
            setError('File âm thanh trống. Vui lòng thử lại.');
            return;
          }
          
          // Tạo URL cho việc phát âm thanh
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Tạo file từ blob để upload
          const currentWord = words[currentWordIndex];
          const wordText = typeof currentWord === 'string' ? currentWord : currentWord.word;
          const timestamp = new Date().getTime(); // Thêm timestamp để tránh cache
          const file = new File(
            [audioBlob], 
            `${wordText.replace(/\s+/g, '_')}_${timestamp}.wav`, 
            { type: 'audio/wav' }
          );
          setAudioFile(file);
          
          // Log kích thước file để debug
          console.log(`Đã tạo file âm thanh: ${file.name}, kích thước: ${file.size} bytes`);
          
          // Giải phóng track của stream
          if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
        } catch (error) {
          console.error('Lỗi khi xử lý audio sau khi ghi âm:', error);
          setError('Đã xảy ra lỗi khi xử lý âm thanh. Vui lòng thử lại.');
        }
      };
      
      // Bắt đầu ghi âm
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
      setError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập: ' + err.message);
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setRecording(false);
      }
      
      // Đảm bảo giải phóng tất cả tracks để tránh lỗi khi ghi âm lại
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error('Lỗi khi dừng ghi âm:', err);
      setError('Đã xảy ra lỗi khi dừng ghi âm.');
    }
  };

  // Thêm hàm thay thế để upload file trực tiếp
  const uploadVocabularyDirectly = async (word, audioFile, overwrite = false) => {
    try {
      const formData = new FormData();
      formData.append('word', word);
      formData.append('audio_file', audioFile);
      formData.append('overwrite', overwrite ? 'true' : 'false');
      
      // Log trước khi upload
      console.log('Đang upload trực tiếp với FormData:', {
        word,
        audioFileName: audioFile.name,
        audioFileSize: audioFile.size,
        overwrite
      });
      
      // Lấy base URL từ api.js
      const API_URL = 'http://localhost:8000';
      const url = `${API_URL}/voice-library/profiles/${profileId}/vocabulary?user_id=${userId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Không cần set header Content-Type khi sử dụng FormData với fetch
      });
      
      // Kiểm tra lỗi
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      // Parse json response
      const data = await response.json();
      console.log('Kết quả upload trực tiếp:', data);
      return data;
    } catch (error) {
      console.error('Lỗi trong quá trình upload trực tiếp:', error);
      throw error;
    }
  };

  const saveCurrentWord = async (overwrite = false) => {
    if (!audioFile) {
      setError('Vui lòng ghi âm trước khi lưu');
      return;
    }

    const currentWord = words[currentWordIndex].word || words[currentWordIndex];
    setLoading(true);
    setError(null);

    try {
      // Log để debug
      console.log('Đang lưu từ vựng:', {
        word: currentWord,
        audioFile,
        overwrite,
        currentIndex: currentWordIndex,
        profileId,
        userId
      });
      
      // Kiểm tra xem từ này đã tồn tại và chưa được xác nhận ghi đè
      const wordExists = existingWords.includes(currentWord.toLowerCase()) && !overwrite;
      
      if (wordExists) {
        // Hiển thị confirmation modal
        setExistingVocab({word: currentWord});
        setShowOverwriteConfirm(true);
        setLoading(false);
        return;
      }
      
      try {
        // Sử dụng phương thức upload trực tiếp thay vì qua service
        const result = await uploadVocabularyDirectly(currentWord, audioFile, overwrite);
        console.log('Kết quả từ API:', result);
        
        // Cập nhật tiến độ
        setProgress(((currentWordIndex + 1) / words.length) * 100);
        
        // Cập nhật danh sách từ đã ghi
        setWords(prevWords => {
          const newWords = [...prevWords];
          if (newWords[currentWordIndex]) {
            newWords[currentWordIndex] = {
              ...newWords[currentWordIndex],
              recorded: true
            };
          }
          return newWords;
        });
        
        // Chuyển đến từ tiếp theo
        startNextWord();
      } catch (apiError) {
        console.error('API error:', apiError);
        throw apiError;
      }
    } catch (err) {
      console.error('Chi tiết lỗi khi lưu từ vựng:', err);
      // Hiển thị thông báo lỗi chi tiết để debug
      const errorMessage = err.response?.data?.detail || err.message || 'Không xác định';
      setError(`Không thể lưu từ "${currentWord}". Lỗi: ${errorMessage}`);
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

  // Kiểm tra danh sách từ vựng đã tồn tại
  const checkExistingVocabularies = async () => {
    setLoading(true);
    try {
      // Lấy danh sách từ vựng hiện có với limit lớn
      const existingVocabulariesResult = await vocabularyService.getVocabularies(profileId, userId, 1, 1000);
      const existingWords = existingVocabulariesResult.data.map(v => v.word.toLowerCase());
      
      // Lưu danh sách từ đã tồn tại
      setExistingWords(existingWords);
      
      // Đánh dấu từ đã tồn tại
      setWords(prevWords => prevWords.map(item => {
        const word = typeof item === 'string' ? item : item.word;
        return {
          word: word,
          recording: false,
          recorded: false,
          exists: existingWords.includes(word.toLowerCase()),
          audioUrl: null
        };
      }));
    } catch (error) {
      console.error("Lỗi khi kiểm tra từ vựng:", error);
      setError("Không thể kiểm tra từ vựng đã tồn tại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi nhập danh sách từ vựng
  const handleWordsInput = async (inputWords) => {
    // Chuyển đổi chuỗi thành mảng từ vựng
    const wordList = inputWords
      .split(/[\n,]/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
      .map((word) => ({
        word,
        recording: false,
        recorded: false,
        exists: false,
        audioUrl: null,
      }));

    setWords(wordList);
    
    // Kiểm tra các từ đã tồn tại
    if (wordList.length > 0) {
      await checkExistingVocabularies();
    }
    
    setShowInput(false);
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
                <h3 className="display-4">"{typeof words[currentWordIndex] === 'string' ? words[currentWordIndex] : words[currentWordIndex].word}"</h3>
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