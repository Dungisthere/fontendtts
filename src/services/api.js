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
      // Xử lý trường hợp khi response trả về detail
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      }
      
      // Xử lý các loại lỗi khác khi không có detail
      if (error.response) {
        const status = error.response.status;
        
        if (status === 401) {
          throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
        } else if (status === 404) {
          throw new Error('Tài khoản không tồn tại');
        }
      }
      
      throw new Error('Đăng nhập thất bại. Vui lòng thử lại sau.');
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
      
      // Xử lý trường hợp khi response trả về detail
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      }
      
      // Xử lý các loại lỗi khác khi không có detail
      if (error.response) {
        const status = error.response.status;
        
        if (status === 400) {
          throw new Error('Thông tin đăng ký không hợp lệ');
        } else if (status === 409) {
          throw new Error('Tên đăng nhập hoặc email đã tồn tại');
        }
      }
      
      throw new Error('Đăng ký thất bại. Vui lòng thử lại sau.');
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
      return response;
    } catch (error) {
      console.error('TTS generation error:', error);
      throw error;
    }
  }
};

export const configService = {
  // Lấy thông tin cấu hình
  getConfig: async () => {
    try {
      console.log('Đang gọi API lấy cấu hình...');
      const response = await api.get('/config');
      console.log('Kết quả API lấy cấu hình:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get config error:', error);
      // Trả về đối tượng rỗng thay vì throw error để tránh crash UI
      if (error.response && error.response.status === 404) {
        console.log('Chưa có cấu hình, trả về đối tượng rỗng');
        return {};
      }
      throw error;
    }
  },
  
  // Cập nhật cấu hình
  updateConfig: async (configData) => {
    try {
      // Kiểm tra quyền admin
      const user = getUserFromStorage();
      if (!user || user.usertype !== 'admin') {
        throw new Error('Không có quyền cập nhật cấu hình');
      }
      
      console.log('Đang gọi API cập nhật cấu hình:', configData);
      const response = await api.put('/config', configData);
      console.log('Kết quả API cập nhật cấu hình:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update config error:', error);
      throw error;
    }
  }
};

export default api; 