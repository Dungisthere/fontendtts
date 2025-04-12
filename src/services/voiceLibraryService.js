import api from './api';

// Service xử lý voice profile
export const voiceProfileService = {
  // Tạo profile mới
  createProfile: async (userId, profileData) => {
    try {
      const response = await api.post(`/voice-library/profiles?user_id=${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Lỗi tạo voice profile:', error);
      throw error;
    }
  },

  // Lấy danh sách profile của người dùng
  getProfiles: async (userId) => {
    try {
      const response = await api.get(`/voice-library/profiles/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách voice profile:', error);
      throw error;
    }
  },

  // Lấy chi tiết một profile
  getProfileDetail: async (profileId, userId) => {
    try {
      const response = await api.get(`/voice-library/profiles/${profileId}?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy chi tiết voice profile:', error);
      throw error;
    }
  },

  // Cập nhật profile
  updateProfile: async (profileId, userId, profileData) => {
    try {
      const response = await api.put(`/voice-library/profiles/${profileId}?user_id=${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật voice profile:', error);
      throw error;
    }
  },

  // Xóa profile
  deleteProfile: async (profileId, userId) => {
    try {
      await api.delete(`/voice-library/profiles/${profileId}?user_id=${userId}`);
      return true;
    } catch (error) {
      console.error('Lỗi xóa voice profile:', error);
      throw error;
    }
  }
};

// Service xử lý vocabulary
export const vocabularyService = {
  // Thêm từ vựng mới
  addVocabulary: async (profileId, userId, wordOrFormData, audioFile) => {
    try {
      let formData;
      
      // Kiểm tra nếu đã truyền vào FormData
      if (wordOrFormData instanceof FormData) {
        formData = wordOrFormData;
      } else {
        // Cách cũ: truyền riêng word và audioFile
        formData = new FormData();
        formData.append('word', wordOrFormData);
        formData.append('audio_file', audioFile);
        formData.append('overwrite', false); // Mặc định không ghi đè
      }

      const response = await api.post(
        `/voice-library/profiles/${profileId}/vocabulary?user_id=${userId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Lỗi thêm từ vựng:', error);
      throw error;
    }
  },

  // Lấy danh sách từ vựng
  getVocabularies: async (profileId, userId) => {
    try {
      const response = await api.get(`/voice-library/profiles/${profileId}/vocabulary?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách từ vựng:', error);
      throw error;
    }
  },

  // Lấy audio của từ vựng
  getVocabularyAudio: async (profileId, userId, word) => {
    try {
      const response = await api.get(
        `/voice-library/profiles/${profileId}/vocabulary/${encodeURIComponent(word)}/audio?user_id=${userId}`,
        { responseType: 'blob' }
      );
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Lỗi lấy audio từ vựng:', error);
      throw error;
    }
  },

  // Xóa từ vựng
  deleteVocabulary: async (profileId, userId, word) => {
    try {
      await api.delete(`/voice-library/profiles/${profileId}/vocabulary?user_id=${userId}`, {
        data: { word }
      });
      return true;
    } catch (error) {
      console.error('Lỗi xóa từ vựng:', error);
      throw error;
    }
  }
};

// Service xử lý text-to-speech
export const voiceTtsService = {
  // Chuyển văn bản thành giọng nói
  textToSpeech: async (profileId, userId, text) => {
    try {
      const response = await api.post(
        `/voice-library/text-to-speech?user_id=${userId}`,
        {
          voice_profile_id: profileId,
          text: text
        },
        { responseType: 'blob' }
      );
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Lỗi chuyển văn bản thành giọng nói:', error);
      throw error;
    }
  }
}; 