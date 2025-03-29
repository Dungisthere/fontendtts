import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (username, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await api.post('/users/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return response;
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
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getMe: async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
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
      return response;
    } catch (error) {
      console.error('Get models error:', error);
      throw error;
    }
  },
  
  // Lấy danh sách giọng đọc cho VietTTS
  getVoices: async () => {
    try {
      const response = await api.get('/tts/voices');
      return response;
    } catch (error) {
      console.error('Get TTS voices error:', error);
      throw error;
    }
  },
  
  // API tạo giọng nói với tùy chọn model và giọng đọc
  generateSpeech: async (text, model_type = "mien-nam", voice = null, speed = 1.0) => {
    const token = localStorage.getItem('token');
    try {
      const response = await api.post('/tts-facebook/generate', 
        { 
          text,
          model_type,
          voice,
          speed
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob'
        }
      );
      return response;
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }
};

export default api; 