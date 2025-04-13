import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, Table, Alert, Spinner, Modal, Tabs, Tab, Pagination } from 'react-bootstrap';
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
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
  
  // Thêm state cho modal kết quả đồng bộ
  const [showSyncResult, setShowSyncResult] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  
  // Thêm biến state để kiểm tra từ đã tồn tại
  const [wordExists, setWordExists] = useState(false);
  
  // Thêm hàm kiểm tra từ vựng tồn tại
  const checkWordExists = async (word) => {
    if (!word.trim()) return false;
    
    try {
      const result = await vocabularyService.getVocabularies(profile.id, userId, 1, 1000);
      return result.data.some(vocab => vocab.word.toLowerCase() === word.toLowerCase());
    } catch (error) {
      console.error("Lỗi khi kiểm tra từ vựng:", error);
      return false;
    }
  };
  
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
  
  // Load danh sách từ vựng
  const loadVocabularies = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Đang tải danh sách từ vựng cho profile ${profile.id}`);
      const result = await vocabularyService.getVocabularies(profile.id, userId, page, pageSize);
      setVocabularies(result.data);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 1);
      setCurrentPage(page);
      
      console.log('Đã tải danh sách từ vựng:', result);
    } catch (err) {
      console.error('Chi tiết lỗi khi tải danh sách từ vựng:', err);
      
      let errorMessage = 'Không thể tải danh sách từ vựng. Vui lòng thử lại sau.';
      
      // Cải thiện hiển thị lỗi
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage += ` Lý do: ${err.response.data.detail}`;
        } else if (typeof err.response.data === 'object') {
          errorMessage += ` Lý do: ${JSON.stringify(err.response.data)}`;
        }
      } else if (err.message) {
        errorMessage += ` Lỗi: ${err.message}`;
      }
      
      setError(errorMessage);
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
      
      // Tải lại danh sách từ vựng
      await loadVocabularies();
      
      // Reset hoàn toàn các state
      setNewWord('');
      setAudioFile(null);
      setAudioUrl(null);
      setWordExists(false);
      
      // Đảm bảo recorder được dừng và giải phóng
      stopRecording();
      
      // Đóng modal
      setShowAddModal(false);
      setShowOverwriteConfirm(false);
      
      // Hiển thị thông báo thành công
      setSuccessMessage(result.message || `Đã ${overwrite ? 'cập nhật' : 'thêm'} từ "${newWord}" vào thư viện thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Lỗi khi thêm từ vựng:', err);
      setError('Không thể thêm từ vựng. Vui lòng thử lại sau.');
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
      // Đảm bảo dừng phiên ghi âm trước đó nếu có
      if (mediaRecorderRef.current) {
        stopRecording();
      }
      
      // Reset các state liên quan đến ghi âm
      setAudioUrl(null);
      setAudioFile(null);
      audioChunksRef.current = [];
      
      console.log('Bắt đầu ghi âm mới...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        try {
          if (audioChunksRef.current.length === 0) {
            console.warn('Không có dữ liệu âm thanh được thu thập');
            return;
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          if (audioBlob.size === 0) {
            console.warn('Tạo blob âm thanh rỗng');
            return;
          }
          
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          
          // Tạo file từ blob để upload
          const filename = newWord.toLowerCase().replace(/\s+/g, '_').replace(/[^\w\s-]/g, '_');
          const file = new File([audioBlob], `${filename}.wav`, { type: 'audio/wav' });
          setAudioFile(file);
          
          console.log('Đã lưu audio blob thành công, kích thước:', audioBlob.size);
        } catch (error) {
          console.error('Lỗi khi xử lý dữ liệu ghi âm:', error);
        }
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('Lỗi MediaRecorder:', event.error);
      };
      
      // Bắt đầu ghi âm với độ dài chunk 10ms để xử lý tốt hơn
      mediaRecorderRef.current.start(10);
      setRecording(true);
    } catch (err) {
      console.error('Không thể truy cập microphone:', err);
      
      let errorMessage = 'Không thể truy cập microphone. ';
      
      // Phân loại lỗi chi tiết hơn
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Bạn đã từ chối quyền truy cập. Vui lòng cấp quyền và thử lại.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'Không tìm thấy thiết bị microphone. Vui lòng kết nối microphone và thử lại.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Microphone đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại.';
      } else {
        errorMessage += `Lỗi: ${err.message}`;
      }
      
      setError(errorMessage);
      setRecording(false);
    }
  };
  
  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        
        // Dừng tất cả các track và giải phóng
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      }
      
      // Reset hoàn toàn MediaRecorder
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setRecording(false);
      
      console.log('Đã dừng và giải phóng recorder');
    } catch (err) {
      console.error('Lỗi khi dừng ghi âm:', err);
      // Đảm bảo state recording được reset ngay cả khi có lỗi
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
  
  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    loadVocabularies(page);
  };
  
  // Thêm component phân trang
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    // Tạo một mảng các số trang sẽ hiển thị
    let pageItems = [];
    
    // Luôn hiển thị trang đầu tiên
    pageItems.push(1);
    
    // Tính toán phạm vi hiển thị xung quanh trang hiện tại
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Thêm dấu ... nếu có khoảng cách từ trang 1 đến startPage
    if (startPage > 2) {
      pageItems.push('ellipsis1');
    }
    
    // Thêm các trang ở giữa
    for (let i = startPage; i <= endPage; i++) {
      if (!pageItems.includes(i)) {
        pageItems.push(i);
      }
    }
    
    // Thêm dấu ... nếu có khoảng cách từ endPage đến trang cuối
    if (endPage < totalPages - 1) {
      pageItems.push('ellipsis2');
    }
    
    // Luôn hiển thị trang cuối cùng nếu có nhiều hơn 1 trang
    if (totalPages > 1 && !pageItems.includes(totalPages)) {
      pageItems.push(totalPages);
    }
    
    return (
      <Pagination className="mt-3 justify-content-center">
        <Pagination.First 
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        
        {pageItems.map((item, index) => {
          if (item === 'ellipsis1' || item === 'ellipsis2') {
            return <Pagination.Ellipsis key={item} disabled />;
          }
          
          return (
            <Pagination.Item 
              key={`page-${item}`} 
              active={item === currentPage}
              onClick={() => handlePageChange(item)}
            >
              {item}
            </Pagination.Item>
          );
        })}
        
        <Pagination.Next 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last 
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };
  
  // Thêm các tab states nếu cần thiết
  const [activeTab, setActiveTab] = useState('vocabulary-list');
  
  // Thêm hàm đồng bộ từ vựng
  const handleSyncVocabulary = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Bắt đầu đồng bộ từ vựng cho profile ${profile.id}`);
      
      // Hiển thị thông báo đang đồng bộ
      setSuccessMessage("Đang đồng bộ từ vựng với thư mục. Vui lòng đợi...");
      
      // Gọi API đồng bộ từ vựng
      const result = await vocabularyService.syncVocabulary(profile.id, userId);
      setSyncResult(result);
      setShowSyncResult(true);
      
      // Hiển thị thông tin chi tiết kết quả đồng bộ
      const addedCount = result.added_records ? result.added_records.length : 0;
      const missingCount = result.missing_files ? result.missing_files.length : 0;
      
      let syncMessage = `Đã đồng bộ từ vựng thành công! `;
      if (addedCount > 0) {
        syncMessage += `Thêm mới: ${addedCount} từ. `;
      }
      if (missingCount > 0) {
        syncMessage += `Từ thiếu file: ${missingCount}.`;
      }
      
      setSuccessMessage(syncMessage);
      
      // Sau khi đồng bộ thành công, tải lại danh sách
      await loadVocabularies();
      
      console.log('Đồng bộ từ vựng hoàn tất:', result);
    } catch (err) {
      console.error('Chi tiết lỗi khi đồng bộ từ vựng:', err);
      
      let errorMessage = 'Không thể đồng bộ từ vựng. Vui lòng thử lại sau.';
      
      // Cải thiện hiển thị lỗi
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage += ` Lý do: ${err.response.data.detail}`;
        } else if (typeof err.response.data === 'object') {
          errorMessage += ` Lý do: ${JSON.stringify(err.response.data)}`;
        }
      } else if (err.message) {
        errorMessage += ` Lỗi: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      // Hủy thông báo thành công sau 5 giây
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };
  
  // Hiển thị danh sách từ vựng
  const renderVocabularyList = () => {
    if (loading) {
      return (
        <div className="text-center my-3">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải danh sách từ vựng...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={() => loadVocabularies()}>
              Thử lại
            </Button>
          </div>
        </Alert>
      );
    }
    
    if (!vocabularies || vocabularies.length === 0) {
      return (
        <Alert variant="info">
          Chưa có từ vựng nào trong thư viện. 
          <div className="mt-2">
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              Ghi âm từ mới ngay
            </Button>
            {' '}
            <Button variant="outline-info" size="sm" onClick={() => handleSyncVocabulary()}>
              Đồng bộ từ thư mục
            </Button>
          </div>
        </Alert>
      );
    }
    
    return (
      <>
        <div className="vocabulary-filters mb-3 d-flex justify-content-between align-items-center">
          <div>
            <strong>Tổng số từ vựng:</strong> {totalCount}
          </div>
          <div>
            <Form.Select 
              size="sm" 
              style={{ width: 'auto', display: 'inline-block' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                loadVocabularies(1);
              }}
            >
              <option value="10">10 từ/trang</option>
              <option value="20">20 từ/trang</option>
              <option value="50">50 từ/trang</option>
              <option value="100">100 từ/trang</option>
            </Form.Select>
          </div>
        </div>
        
        <div className="table-responsive">
          <Table bordered hover className="vocabulary-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Từ</th>
                <th style={{ width: '40%' }}>Ngày tạo</th>
                <th style={{ width: '20%' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {vocabularies.map((vocab) => (
                <tr key={vocab.id}>
                  <td>{vocab.word}</td>
                  <td>{formatDate(vocab.created_at)}</td>
                  <td className="action-buttons">
                    <div className="d-flex flex-column flex-md-row gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handlePlayAudio(vocab)}
                        disabled={playingWordId === vocab.id}
                        className="btn-action"
                      >
                        {playingWordId === vocab.id ? (
                          <><i className="fas fa-volume-up"></i> Đang phát</>
                        ) : (
                          <><i className="fas fa-volume-up"></i> Nghe</>
                        )}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteVocabulary(vocab.word)}
                        className="btn-action"
                      >
                        <i className="fas fa-trash"></i> Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        
        {renderPagination()}
      </>
    );
  };
  
  // Cải thiện xử lý lỗi khi xử lý audio
  const handleAudioError = (error) => {
    console.error('Lỗi xử lý âm thanh:', error);
    
    let errorMessage = 'Không thể xử lý âm thanh. Vui lòng thử lại.';
    
    if (error.response && error.response.data) {
      if (error.response.data.detail) {
        errorMessage = `Lỗi: ${error.response.data.detail}`;
      }
    } else if (error.message) {
      errorMessage = `Lỗi: ${error.message}`;
    }
    
    setError(errorMessage);
    
    // Kiểm tra lỗi quyền truy cập microphone
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      setError('Bạn đã từ chối quyền truy cập microphone. Vui lòng cấp quyền và thử lại.');
    }
    
    return errorMessage;
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
            {renderVocabularyList()}
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
      <Modal 
        show={showAddModal} 
        onHide={() => {
          // Đảm bảo reset tất cả trạng thái khi đóng modal
          setShowAddModal(false);
          setNewWord('');
          setAudioFile(null);
          setAudioUrl(null);
          setWordExists(false);
          stopRecording(); // Đảm bảo dừng ghi âm nếu đang ghi
        }}
      >
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
                    <div className="d-flex gap-2 mt-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => {
                          setAudioUrl(null);
                          setAudioFile(null);
                        }}
                      >
                        <i className="fas fa-trash"></i> Xóa
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => {
                          // Reset và bắt đầu ghi âm mới
                          setAudioUrl(null);
                          setAudioFile(null);
                          startRecording();
                        }}
                      >
                        <i className="fas fa-redo"></i> Ghi âm lại
                      </Button>
                    </div>
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
      
      {/* Modal kết quả đồng bộ */}
      <Modal show={showSyncResult} onHide={() => setShowSyncResult(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Kết quả đồng bộ từ vựng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {syncResult ? (
            <div>
              <div className="mb-3">
                <Alert variant="info">
                  <strong>Thông báo:</strong> {syncResult.message}
                </Alert>
                
                <div className="d-flex flex-wrap justify-content-between mb-3">
                  <div className="mb-2 me-3">
                    <strong>Tổng số file trong thư mục:</strong> {syncResult.total_files}
                  </div>
                  {syncResult.unique_files !== undefined && (
                    <div className="mb-2 me-3">
                      <strong>Số file không trùng lặp:</strong> {syncResult.unique_files}
                    </div>
                  )}
                  {syncResult.duplicate_files !== undefined && (
                    <div className="mb-2 me-3">
                      <strong>Số file trùng lặp:</strong> {syncResult.duplicate_files}
                    </div>
                  )}
                  <div className="mb-2 me-3">
                    <strong>Tổng số bản ghi trong database:</strong> {syncResult.total_records}
                  </div>
                </div>
              </div>
              
              {syncResult.added_records && syncResult.added_records.length > 0 && (
                <div className="mb-3">
                  <h6>Đã thêm {syncResult.added_records.length} từ mới vào database:</h6>
                  <div className="border rounded p-2 mb-3" style={{maxHeight: '200px', overflowY: 'auto'}}>
                    <ul className="list-group">
                      {syncResult.added_records.map((word, index) => (
                        <li key={index} className="list-group-item list-group-item-success">
                          {word}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {syncResult.missing_files && syncResult.missing_files.length > 0 && (
                <div className="mb-3">
                  <h6>Đang thiếu {syncResult.missing_files.length} file âm thanh:</h6>
                  <div className="alert alert-warning">
                    <p>Những từ sau tồn tại trong database nhưng không tìm thấy file âm thanh tương ứng:</p>
                    <div className="border rounded p-2" style={{maxHeight: '200px', overflowY: 'auto'}}>
                      <ul>
                        {syncResult.missing_files.map((word, index) => (
                          <li key={index}>{word}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Thông tin debug nâng cao */}
              {syncResult.debug_info && (
                <div className="mt-4">
                  <details>
                    <summary className="text-muted mb-2 fw-bold">Thông tin kỹ thuật (dành cho developer)</summary>
                    <div className="border rounded p-3 bg-light">
                      <h6>Tất cả các file trong thư mục:</h6>
                      <div className="border p-2 bg-white mb-3" style={{maxHeight: '150px', overflowY: 'auto'}}>
                        <pre style={{fontSize: '0.8rem'}}>{JSON.stringify(syncResult.debug_info.all_files, null, 2)}</pre>
                      </div>
                      
                      <h6>Các file âm thanh được lọc:</h6>
                      <div className="border p-2 bg-white mb-3" style={{maxHeight: '150px', overflowY: 'auto'}}>
                        <pre style={{fontSize: '0.8rem'}}>{JSON.stringify(syncResult.debug_info.filtered_audio_files, null, 2)}</pre>
                      </div>
                      
                      <h6>Các từ trong database:</h6>
                      <div className="border p-2 bg-white" style={{maxHeight: '150px', overflowY: 'auto'}}>
                        <pre style={{fontSize: '0.8rem'}}>{JSON.stringify(syncResult.debug_info.db_words, null, 2)}</pre>
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ) : (
            <p>Đang đồng bộ từ vựng...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSyncResult(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProfileDetail; 