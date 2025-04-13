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
        console.log('Sử dụng FormData đã được truyền vào');
      } else {
        // Cách cũ: truyền riêng word và audioFile
        if (!wordOrFormData || !audioFile) {
          throw new Error('Thiếu thông tin từ vựng hoặc file âm thanh');
        }
        
        console.log(`Tạo FormData mới với từ "${wordOrFormData}" và file ${audioFile.name}`);
        formData = new FormData();
        formData.append('word', wordOrFormData);
        formData.append('audio_file', audioFile);
        formData.append('overwrite', false); // Mặc định không ghi đè
      }

      // Kiểm tra kích thước file
      const audioFileValue = formData.get('audio_file');
      if (audioFileValue && audioFileValue.size === 0) {
        throw new Error('File âm thanh rỗng');
      }

      // Kiểm tra word
      const word = formData.get('word');
      if (!word || word.trim() === '') {
        throw new Error('Từ vựng không được để trống');
      }

      console.log(`Đang gửi request thêm từ vựng đến API: profileId=${profileId}, userId=${userId}`);
      
      const response = await api.post(
        `/voice-library/profiles/${profileId}/vocabulary?user_id=${userId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // Tăng timeout lên 30 giây vì việc xử lý âm thanh có thể mất thời gian
        }
      );
      
      console.log('Kết quả thêm từ vựng:', response.data);
      return response.data;
    } catch (error) {
      console.error('Lỗi thêm từ vựng:', error);
      
      // Ghi log chi tiết hơn
      if (error.response) {
        console.error('Server trả về lỗi khi thêm từ vựng:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw error;
    }
  },

  // Lấy danh sách từ vựng
  getVocabularies: async (profileId, userId, page = 1, pageSize = 10) => {
    try {
      const skip = (page - 1) * pageSize;
      
      // Log trước khi gọi API
      console.log(`Đang gọi API từ vựng với profileId=${profileId}, userId=${userId}, skip=${skip}, limit=${pageSize}`);
      
      const response = await api.get(
        `/voice-library/profiles/${profileId}/vocabulary?user_id=${userId}&skip=${skip}&limit=${pageSize}`,
        { timeout: 10000 } // Thêm timeout 10 giây
      );
      
      // Ghi log để debug khi cần
      console.log('API vocabulary response:', response);
      
      // Lấy tổng số từ vựng từ header
      const totalCount = parseInt(response.headers['x-total-count'] || '0');
      
      return {
        data: response.data, 
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      };
    } catch (error) {
      console.error('Lỗi lấy danh sách từ vựng:', error);
      
      // Ghi log chi tiết hơn
      if (error.response) {
        // Lỗi có response từ server
        console.error('Server trả về lỗi:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Lỗi không nhận được response từ server
        console.error('Không nhận được phản hồi từ server:', error.request);
      } else {
        // Lỗi khác
        console.error('Lỗi khi thiết lập request:', error.message);
      }
      
      throw error;
    }
  },

  // Hàm alias cho getVocabularies để tương thích với code cũ 
  getVocabularyList: async (profileId, userId, page = 1, pageSize = 10) => {
    console.log('Sử dụng getVocabularyList (deprecated) - nên dùng getVocabularies thay thế');
    return vocabularyService.getVocabularies(profileId, userId, page, pageSize);
  },

  // Đồng bộ từ vựng với file audio
  syncVocabulary: async (profileId, userId) => {
    try {
      console.log(`Đang gọi API đồng bộ với profileId=${profileId}, userId=${userId}`);
      
      const response = await api.post(
        `/voice-library/profiles/${profileId}/sync-vocabulary?user_id=${userId}`,
        {}, // Body rỗng
        { timeout: 30000 } // Thêm timeout 30 giây vì đồng bộ có thể tốn thời gian
      );
      
      console.log('Kết quả đồng bộ:', response.data);
      return response.data;
    } catch (error) {
      console.error('Lỗi đồng bộ từ vựng:', error);
      
      // Ghi log chi tiết hơn
      if (error.response) {
        // Lỗi có response từ server
        console.error('Server trả về lỗi khi đồng bộ:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // Lỗi không nhận được response từ server
        console.error('Không nhận được phản hồi từ server khi đồng bộ:', error.request);
      } else {
        // Lỗi khác
        console.error('Lỗi khi thiết lập request đồng bộ:', error.message);
      }
      
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
      console.log(`Đang gửi yêu cầu TTS cho profile ${profileId} với văn bản: "${text}"`);
      
      // Chế độ debug: kiểm tra từ vựng trước khi gửi yêu cầu
      try {
        const vocabResult = await vocabularyService.getVocabularies(profileId, userId, 1, 1000);
        const availableWords = vocabResult.data.map(vocab => vocab.word.toLowerCase());
        
        // Xử lý text để phát hiện từ thiếu
        let processedText = text.toLowerCase().trim();
        
        // Thêm khoảng trắng trước dấu câu để tách riêng
        for (const punct of [',', '.', '?', '!', ':', ';']) {
          processedText = processedText.replace(punct, ` ${punct}`);
        }
        
        // Tách từ
        const words = processedText.split(/\s+/).filter(word => word.trim() !== '');
        
        // Tìm từ thiếu
        const missingWords = words.filter(word => !availableWords.includes(word));
        
        if (missingWords.length > 0) {
          console.warn('Cảnh báo: Phát hiện từ thiếu trước khi gửi request:', missingWords);
        }
      } catch (e) {
        // Bỏ qua lỗi trong kiểm tra từ vựng
        console.warn('Không thể kiểm tra từ vựng trước khi gửi yêu cầu TTS:', e);
      }
      
      const response = await api.post(
        `/voice-library/text-to-speech?user_id=${userId}`,
        {
          voice_profile_id: profileId,
          text: text
        },
        { 
          responseType: 'blob',
          timeout: 60000, // 1 phút timeout cho văn bản dài
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Kiểm tra nếu response không phải blob
      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Phản hồi từ server không phải định dạng audio hợp lệ');
      }
      
      console.log('Đã nhận phản hồi TTS thành công, kích thước:', response.data.size);
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Lỗi chuyển văn bản thành giọng nói:', error);
      
      // Xử lý lỗi nếu server trả về lỗi dạng JSON thay vì blob
      if (error.response && error.response.data instanceof Blob) {
        try {
          // Đọc nội dung lỗi từ blob
          const errorText = await error.response.data.text();
          try {
            // Thử parse lỗi thành JSON
            const errorJson = JSON.parse(errorText);
            if (errorJson.detail) {
              error.response.data = errorJson;
            }
          } catch {
            console.warn('Không thể parse lỗi thành JSON:', errorText);
          }
        } catch (e) {
          console.warn('Không thể đọc nội dung lỗi:', e);
        }
      }
      
      throw error;
    }
  }
}; 