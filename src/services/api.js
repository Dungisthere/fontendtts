import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lấy user từ localStorage
const getUserFromStorage = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/users/login', {
        username,
        password
      });
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (username, email, password) => {
    try {
      const response = await api.post('/users/register', {
        username,
        email,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getMe: async () => {
    const user = getUserFromStorage();
    if (!user) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }
    
    try {
      // Lấy thông tin user dựa vào ID
      const response = await api.get(`/users/${user.id}`);
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
};

export const ttsService = {
  // Lấy danh sách các model và giọng đọc
  getModels: async () => {
    try {
      const response = await api.get('/tts/models');
      return response.data;
    } catch (error) {
      console.error('Get models error:', error);
      throw error;
    }
  },
  
  // Lấy danh sách giọng đọc cho VietTTS
  getVoices: async () => {
    try {
      const response = await api.get('/tts/voices');
      return response.data;
    } catch (error) {
      console.error('Get TTS voices error:', error);
      throw error;
    }
  },
  
  // API tạo giọng nói với tùy chọn model và giọng đọc
  generateSpeech: async (text, model_type = "mien-nam", voice = null, speed = 1.0) => {
    // Kiểm tra đăng nhập từ localStorage
    const user = localStorage.getItem('user');
    if (!user) {
      throw new Error('Vui lòng đăng nhập để sử dụng dịch vụ');
    }
    
    try {
      const response = await api.post('/tts-facebook/generate', 
        { 
          text,
          model_type,
          voice,
          speed
        },
        {
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }
};

export default api; 