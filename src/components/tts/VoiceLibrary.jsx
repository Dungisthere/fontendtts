import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, Tabs, Tab, Button, Alert, Spinner } from 'react-bootstrap';
import { voiceProfileService } from '../../services/voiceLibraryService';
import ProfileList from './voiceLibrary/ProfileList';
import ProfileDetail from './voiceLibrary/ProfileDetail';
import CreateProfile from './voiceLibrary/CreateProfile';
import TextToSpeechConverter from './voiceLibrary/TextToSpeechConverter';

const VoiceLibrary = () => {
  const user = useSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Hiệu ứng khi component mount và khi user thay đổi
  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  // Kiểm tra xem có mã khởi tạo nào cần bổ sung
  useEffect(() => {
    // Thêm bất kỳ khởi tạo cần thiết khác
    console.log("VoiceLibrary component đã được tải lại");
  }, []);

  // Xử lý load danh sách profile
  const loadProfiles = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const data = await voiceProfileService.getProfiles(user.id);
      setProfiles(data);
      // Nếu đang không chọn profile nào và có profile, chọn profile đầu tiên
      if (!selectedProfile && data.length > 0) {
        setSelectedProfile(data[0]);
      }
    } catch (err) {
      setError('Không thể tải danh sách profile giọng nói. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn profile
  const handleSelectProfile = async (profile) => {
    setSelectedProfile(profile);
    setActiveTab('detail');
  };

  // Xử lý khi tạo profile mới
  const handleCreateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const newProfile = await voiceProfileService.createProfile(user.id, profileData);
      setProfiles([...profiles, newProfile]);
      setSelectedProfile(newProfile);
      setActiveTab('detail');
      setSuccessMessage('Tạo profile giọng nói mới thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Không thể tạo profile giọng nói. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi xóa profile
  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa profile này? Tất cả từ vựng đã ghi âm sẽ bị xóa.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await voiceProfileService.deleteProfile(profileId, user.id);
      setProfiles(profiles.filter(p => p.id !== profileId));
      setSelectedProfile(null);
      setActiveTab('profiles');
      setSuccessMessage('Xóa profile giọng nói thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Không thể xóa profile giọng nói. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi cập nhật profile
  const handleUpdateProfile = async (profileId, profileData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await voiceProfileService.updateProfile(profileId, user.id, profileData);
      setProfiles(profiles.map(p => p.id === profileId ? updatedProfile : p));
      setSelectedProfile(updatedProfile);
      setSuccessMessage('Cập nhật profile giọng nói thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Không thể cập nhật profile giọng nói. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị thông báo nếu chưa đăng nhập
  if (!user) {
    return (
      <Alert variant="warning">
        Vui lòng đăng nhập để sử dụng tính năng Voice Library.
      </Alert>
    );
  }

  return (
    <div className="voice-library-container">
      <h2 className="my-4">Voice Library - Thư viện giọng nói cá nhân</h2>
      <p className="text-muted">
        Tạo và quản lý thư viện giọng nói của bạn. Ghi âm từng từ vựng và sử dụng chúng để tạo văn bản thành giọng nói độc đáo.
      </p>

      {/* Hiển thị thông báo thành công */}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}

      {/* Hiển thị thông báo lỗi */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang xử lý...</p>
        </div>
      )}

      <Card className="shadow-sm">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key)}
            className="mb-4"
          >
            <Tab eventKey="profiles" title="Danh sách profile">
              <ProfileList
                profiles={profiles}
                onSelectProfile={handleSelectProfile}
                onReload={loadProfiles}
              />
              <Button
                variant="primary"
                className="mt-3"
                onClick={() => setActiveTab('create')}
              >
                Tạo Profile Mới
              </Button>
            </Tab>

            <Tab eventKey="create" title="Tạo profile mới">
              <CreateProfile 
                onCreateProfile={handleCreateProfile}
                onCancel={() => setActiveTab('profiles')}
              />
            </Tab>

            <Tab 
              eventKey="detail" 
              title="Chi tiết profile"
              disabled={!selectedProfile}
            >
              {selectedProfile && (
                <ProfileDetail
                  profile={selectedProfile}
                  userId={user.id}
                  onDeleteProfile={handleDeleteProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onReload={() => {
                    loadProfiles();
                    // Cập nhật lại chi tiết profile đang được chọn
                    if (selectedProfile) {
                      voiceProfileService.getProfileDetail(selectedProfile.id, user.id)
                        .then(data => setSelectedProfile(data))
                        .catch(err => console.error('Không thể cập nhật chi tiết profile:', err));
                    }
                  }}
                />
              )}
            </Tab>

            <Tab 
              eventKey="convert" 
              title="Text to Speech"
              disabled={!profiles.length}
            >
              <TextToSpeechConverter 
                profiles={profiles}
                userId={user.id}
              />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default VoiceLibrary; 