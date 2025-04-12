import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, Table, Alert, Spinner, Modal, Tabs, Tab } from 'react-bootstrap';
import { formatDate } from '../../../utils/formatters';
import { vocabularyService, voiceProfileService } from '../../../services/voiceLibraryService';
import BatchRecorder from './BatchRecorder';
import './VoiceLibraryStyles.css';

const ProfileDetail = ({ profile, userId, onDeleteProfile, onUpdateProfile, onReload }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description || '');
  const [validated, setValidated] = useState(false);
  const [vocabularies, setVocabularies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // State cho modal thêm từ vựng
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  
  // State cho audio player
  const [playingWordId, setPlayingWordId] = useState(null);
  
  // Refs cho media recorder
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Thêm state cho xác nhận ghi đè
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [existingVocab, setExistingVocab] = useState(null);
  
  // Thêm hàm kiểm tra từ vựng tồn tại
  const checkWordExists = async (word) => {
    if (!word.trim()) return false;
    
    try {
      const vocabList = await vocabularyService.getVocabularies(profile.id, userId);
      return vocabList.some(vocab => vocab.word.toLowerCase() === word.toLowerCase());
    } catch (error) {
      console.error("Lỗi khi kiểm tra từ vựng:", error);
      return false;
    }
  };
  
  // Thêm biến state để kiểm tra từ đã tồn tại
  const [wordExists, setWordExists] = useState(false);
  
  // Thêm hàm xử lý thay đổi từ vựng
  const handleWordChange = async (e) => {
    const value = e.target.value;
    setNewWord(value);
    
    if (value.trim()) {
      // Kiểm tra từ vựng đã tồn tại hay chưa
      const exists = await checkWordExists(value);
      setWordExists(exists);
    } else {
      setWordExists(false);
    }
  };
  
  // Tải danh sách từ vựng khi component mount
  useEffect(() => {
    loadVocabularies();
  }, [profile.id, userId]);
  
  // Reset các state khi đóng modal
  useEffect(() => {
    if (!showAddModal) {
      setNewWord('');
      setAudioFile(null);
      setAudioUrl(null);
      setRecording(false);
      stopRecording();
    }
  }, [showAddModal]);
  
  // Lấy danh sách từ vựng
  const loadVocabularies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vocabularyService.getVocabularies(profile.id, userId);
      setVocabularies(data);
    } catch (err) {
      setError('Không thể tải danh sách từ vựng. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý cập nhật profile
  const handleSubmitUpdate = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    onUpdateProfile(profile.id, {
      name: name.trim(),
      description: description.trim()
    });
    setEditing(false);
  };
  
  // Xử lý khi hủy cập nhật
  const handleCancelEdit = () => {
    setName(profile.name);
    setDescription(profile.description || '');
    setEditing(false);
    setValidated(false);
  };
  
  // Xử lý thêm từ vựng mới
  const handleAddVocabulary = async (overwrite = false) => {
    if (!newWord.trim() || (!audioFile && !audioUrl)) {
      setError('Vui lòng nhập từ và ghi âm hoặc chọn file âm thanh.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Chuyển đổi blob url thành file nếu đang sử dụng recorder
      let fileToUpload = audioFile;
      if (audioUrl && !audioFile) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        fileToUpload = new File([blob], `${newWord.toLowerCase().replace(/\s+/g, '_')}.wav`, { type: 'audio/wav' });
      }
      
      // Gọi API với tham số overwrite
      const formData = new FormData();
      formData.append('word', newWord.trim());
      formData.append('audio_file', fileToUpload);
      formData.append('overwrite', overwrite);
      
      const result = await vocabularyService.addVocabulary(profile.id, userId, formData);
      
      // Kiểm tra nếu từ đã tồn tại và chưa xác nhận ghi đè
      if (result.exists && !overwrite) {
        setExistingVocab(result);
        setShowOverwriteConfirm(true);
        setLoading(false);
        return;
      }
      
      await loadVocabularies();
      setShowAddModal(false);
      setShowOverwriteConfirm(false);
      setSuccessMessage(result.message || `Đã ${overwrite ? 'cập nhật' : 'thêm'} từ "${newWord}" vào thư viện thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Không thể thêm từ vựng. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý xác nhận ghi đè
  const handleConfirmOverwrite = () => {
    handleAddVocabulary(true);
  };
  
  // Xử lý xóa từ vựng
  const handleDeleteVocabulary = async (word) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa từ "${word}" khỏi thư viện?`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await vocabularyService.deleteVocabulary(profile.id, userId, word);
      await loadVocabularies();
      setSuccessMessage(`Đã xóa từ "${word}" khỏi thư viện thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Không thể xóa từ vựng. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý phát âm thanh từ vựng
  const handlePlayAudio = async (vocabulary) => {
    try {
      const audioUrl = await vocabularyService.getVocabularyAudio(profile.id, userId, vocabulary.word);
      const audio = new Audio(audioUrl);
      audio.onplay = () => setPlayingWordId(vocabulary.id);
      audio.onended = () => setPlayingWordId(null);
      audio.play();
    } catch (err) {
      setError('Không thể phát âm thanh. Vui lòng thử lại sau.');
      console.error(err);
    }
  };
  
  // Xử lý ghi âm
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
        const file = new File([audioBlob], `${newWord.toLowerCase().replace(/\s+/g, '_')}.wav`, { type: 'audio/wav' });
        setAudioFile(file);
      };
      
      mediaRecorderRef.current.start();
      setRecording(true);
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
  
  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };
  
  return (
    <div className="profile-detail">
      {/* Thông báo thành công */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}
      
      {/* Thông báo lỗi */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Thông tin profile */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Thông tin profile</h5>
          {!editing ? (
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => setEditing(true)}
              >
                <i className="bi bi-pencil me-1"></i> Sửa
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDeleteProfile(profile.id)}
              >
                <i className="bi bi-trash me-1"></i> Xóa
              </Button>
            </div>
          ) : null}
        </Card.Header>
        <Card.Body>
          {editing ? (
            <Form noValidate validated={validated} onSubmit={handleSubmitUpdate}>
              <Form.Group className="mb-3" controlId="editProfileName">
                <Form.Label>Tên profile</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                />
                <Form.Control.Feedback type="invalid">
                  Vui lòng nhập tên profile
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3" controlId="editProfileDescription">
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                />
              </Form.Group>
              
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={handleCancelEdit}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit">
                  Lưu
                </Button>
              </div>
            </Form>
          ) : (
            <div>
              <p><strong>Tên:</strong> {profile.name}</p>
              <p><strong>Mô tả:</strong> {profile.description || '(Không có mô tả)'}</p>
              <p><strong>Ngày tạo:</strong> {formatDate(profile.created_at)}</p>
              <p><strong>Cập nhật lần cuối:</strong> {profile.updated_at ? formatDate(profile.updated_at) : 'Chưa cập nhật'}</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Tabs for vocabulary management */}
      <Tabs defaultActiveKey="vocabulary-list" className="mb-3">
        <Tab eventKey="vocabulary-list" title="Danh sách từ vựng">
          <div className="vocabulary-list">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Từ vựng đã ghi âm</h5>
              <div>
                <Button variant="outline-secondary" size="sm" className="me-2" onClick={loadVocabularies}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Làm mới
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
                  <i className="bi bi-plus-circle me-1"></i> Thêm từ mới
                </Button>
              </div>
            </div>
            
            {loading && (
              <div className="text-center my-3">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Đang xử lý...</p>
              </div>
            )}
            
            {!loading && vocabularies.length === 0 ? (
              <Alert variant="info">
                Chưa có từ vựng nào được thêm vào profile này. Hãy thêm từ vựng mới bằng cách ghi âm giọng của bạn!
              </Alert>
            ) : (
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Từ</th>
                    <th>Ngày thêm</th>
                    <th>Nghe</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {vocabularies.map((vocab) => (
                    <tr key={vocab.id}>
                      <td>{vocab.id}</td>
                      <td>{vocab.word}</td>
                      <td>{formatDate(vocab.created_at)}</td>
                      <td>
                        <Button
                          variant={playingWordId === vocab.id ? "success" : "outline-primary"}
                          size="sm"
                          onClick={() => handlePlayAudio(vocab)}
                          disabled={playingWordId === vocab.id}
                        >
                          {playingWordId === vocab.id ? (
                            <><i className="bi bi-volume-up me-1"></i> Đang phát</>
                          ) : (
                            <><i className="bi bi-play me-1"></i> Nghe</>
                          )}
                        </Button>
                      </td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteVocabulary(vocab.word)}
                        >
                          <i className="bi bi-trash me-1"></i> Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Tab>
        
        <Tab eventKey="batch-record" title="Ghi âm theo đoạn văn">
          <BatchRecorder 
            profileId={profile.id} 
            userId={userId} 
            onComplete={() => {
              loadVocabularies();
              setSuccessMessage('Đã ghi âm từ vựng thành công!');
              setTimeout(() => setSuccessMessage(null), 3000);
            }} 
          />
        </Tab>
      </Tabs>
      
      {/* Modal thêm từ vựng mới */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm từ vựng mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="newWordInput">
              <Form.Label>Từ cần thêm</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập từ cần thêm vào thư viện"
                value={newWord}
                onChange={handleWordChange}
                isInvalid={wordExists}
                required
              />
              {wordExists ? (
                <Form.Control.Feedback type="invalid">
                  Từ này đã tồn tại trong thư viện. Tiếp tục sẽ ghi đè file âm thanh hiện có.
                </Form.Control.Feedback>
              ) : (
                <Form.Text className="text-muted">
                  Nhập một từ đơn hoặc cụm từ ngắn mà bạn muốn ghi âm.
                </Form.Text>
              )}
            </Form.Group>
            
            <div className="mb-3">
              <Form.Label>Âm thanh</Form.Label>
              
              <div className="d-flex flex-column gap-2">
                {/* Ghi âm trực tiếp */}
                <div className="d-flex gap-2">
                  {!recording ? (
                    <Button 
                      variant="primary" 
                      onClick={startRecording}
                      disabled={audioUrl !== null}
                    >
                      <i className="bi bi-mic me-1"></i> Bắt đầu ghi âm
                    </Button>
                  ) : (
                    <Button 
                      variant="danger" 
                      onClick={stopRecording}
                    >
                      <i className="bi bi-stop-circle me-1"></i> Dừng ghi âm
                    </Button>
                  )}
                  
                  {audioUrl && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => {
                        setAudioUrl(null);
                        setAudioFile(null);
                      }}
                    >
                      <i className="bi bi-x-circle me-1"></i> Xóa
                    </Button>
                  )}
                </div>
                
                {/* Hoặc upload file */}
                <div className="mt-2">
                  <Form.Label>Hoặc tải lên file âm thanh</Form.Label>
                  <Form.Control
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    disabled={audioUrl !== null}
                  />
                  <Form.Text className="text-muted">
                    Chấp nhận các file âm thanh: WAV, MP3, OGG
                  </Form.Text>
                </div>
                
                {/* Player */}
                {audioUrl && (
                  <div className="mt-2">
                    <audio controls src={audioUrl} className="w-100"></audio>
                  </div>
                )}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddVocabulary}
            disabled={!newWord.trim() || (!audioFile && !audioUrl) || loading}
          >
            {loading ? (
              <><Spinner as="span" animation="border" size="sm" /> Đang xử lý...</>
            ) : (
              <>Thêm từ vựng</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal xác nhận ghi đè */}
      <Modal show={showOverwriteConfirm} onHide={() => setShowOverwriteConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận ghi đè</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Từ vựng "<strong>{newWord}</strong>" đã tồn tại trong thư viện.</p>
          <p>Bạn có muốn ghi đè file âm thanh hiện tại không?</p>
          {existingVocab && (
            <div className="mt-3">
              <p>File hiện tại:</p>
              <audio src={`/api/voice-library/profiles/${profile.id}/vocabulary/${encodeURIComponent(newWord)}/audio?user_id=${userId}`} controls className="w-100 mb-2"></audio>
            </div>
          )}
          {audioUrl && (
            <div className="mt-3">
              <p>File mới:</p>
              <audio src={audioUrl} controls className="w-100"></audio>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOverwriteConfirm(false)}>
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmOverwrite}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" animation="border" /> : null}
            {' '}Ghi đè
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProfileDetail; 