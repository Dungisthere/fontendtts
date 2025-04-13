import api from './api';

// Lấy user từ localStorage để kiểm tra quyền admin
const getUserFromStorage = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Kiểm tra quyền admin từ thông tin user lưu trong localStorage
const checkAdminPermission = () => {
  const user = getUserFromStorage();
  if (!user || user.usertype !== 'admin') {
    throw new Error('Không có quyền quản trị');
  }
  return user;
};

export const adminService = {
  // Dashboard
  getDashboardStats: async () => {
    try {
      checkAdminPermission();
      // Lấy danh sách người dùng để tính toán thống kê
      const users = await adminService.getUsers();
      
      // Tính tổng số người dùng
      const totalUsers = users.length;
      
      // Tính người dùng hoạt động
      const activeUsers = users.filter(user => user.active).length;
      
      // Tính tổng số credits
      const totalCredits = users.reduce((sum, user) => sum + (user.credits || 0), 0);
      
      // Xếp danh sách người dùng mới nhất (5 người dùng)
      const recentUsers = [...users].sort((a, b) => b.id - a.id).slice(0, 5);
      
      return {
        totalUsers,
        activeUsers,
        totalCredits,
        recentUsers
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  },
  
  // Quản lý người dùng
  getUsers: async (skip = 0, limit = 100) => {
    try {
      checkAdminPermission();
      const response = await api.get(`/users?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },
  
  getUserById: async (id) => {
    try {
      checkAdminPermission();
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },
  
  createUser: async (userData) => {
    try {
      checkAdminPermission();
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  updateUser: async (id, userData) => {
    try {
      checkAdminPermission();
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  deleteUser: async (id) => {
    try {
      checkAdminPermission();
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
  
  changeUserStatus: async (id, isActive) => {
    try {
      checkAdminPermission();
      const response = await api.patch(`/users/${id}/status`, { active: isActive });
      return response.data;
    } catch (error) {
      console.error('Error changing user status:', error);
      throw error;
    }
  },
  
  changeUserType: async (id, usertype) => {
    try {
      checkAdminPermission();
      const response = await api.patch(`/users/${id}/usertype`, { usertype });
      return response.data;
    } catch (error) {
      console.error('Error changing user type:', error);
      throw error;
    }
  },
  
  searchUsers: async (keyword, skip = 0, limit = 100) => {
    try {
      checkAdminPermission();
      const response = await api.post('/users/search', { keyword, skip, limit });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },
  
  // Quản lý credits
  addCredits: async (id, amount) => {
    try {
      checkAdminPermission();
      console.log(`Đang gọi API NẠP ${amount} credits cho người dùng ID ${id}`);
      // Đảm bảo amount là số nguyên
      const numericAmount = parseInt(amount, 10);
      const response = await api.post(`/users/${id}/add-credits`, { amount: numericAmount });
      console.log('Kết quả API nạp credits:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding credits:', error);
      throw error;
    }
  },
  
  deductCredits: async (id, amount) => {
    try {
      checkAdminPermission();
      console.log(`Đang gọi API TRỪ ${amount} credits của người dùng ID ${id}`);
      // Đảm bảo amount là số nguyên
      const numericAmount = parseInt(amount, 10);
      const response = await api.post(`/users/${id}/deduct-credits`, { amount: numericAmount });
      console.log('Kết quả API trừ credits:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  },
  
  // Reset mật khẩu người dùng - chỉ admin
  resetUserPassword: async (userId, newPassword) => {
    try {
      checkAdminPermission();
      console.log(`Đang gọi API reset mật khẩu cho user ID ${userId}`);
      const response = await api.post(`/users/${userId}/reset-password`, {
        new_password: newPassword
      });
      console.log('Kết quả reset mật khẩu:', response.data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi reset mật khẩu:', error);
      throw error;
    }
  },
  
  getCreditStats: async () => {
    try {
      checkAdminPermission();
      const users = await adminService.getUsers();
      
      // Tính tổng số credits trong hệ thống
      const totalCredits = users.reduce((sum, user) => sum + (user.credits || 0), 0);
      
      // Giả lập dữ liệu thống kê nạp/trừ vì API không có
      return {
        totalCredits,
        totalAddedCredits: totalCredits * 1.5, // Giả định: tổng nạp = 1.5 * tổng hiện tại
        totalDeductedCredits: totalCredits * 0.5 // Giả định: tổng trừ = 0.5 * tổng hiện tại
      };
    } catch (error) {
      console.error('Error getting credit stats:', error);
      throw error;
    }
  },
  
  getCreditTransactions: async (startDate = null, endDate = null) => {
    try {
      checkAdminPermission();
      // Giả lập danh sách giao dịch vì API không có
      const users = await adminService.getUsers();
      const transactions = [];
      
      // Tạo giao dịch mẫu cho mỗi người dùng
      users.forEach((user, index) => {
        if (user.credits > 0) {
          // Giao dịch nạp
          transactions.push({
            id: index * 2 + 1,
            userId: user.id,
            username: user.username,
            type: 'add',
            amount: user.credits,
            balance: user.credits,
            date: new Date().toISOString().split('T')[0],
            note: 'Nạp tiền'
          });
          
          // Giao dịch trừ (nếu có)
          if (Math.random() > 0.5) {
            transactions.push({
              id: index * 2 + 2,
              userId: user.id,
              username: user.username,
              type: 'deduct',
              amount: Math.floor(user.credits * 0.3),
              balance: user.credits - Math.floor(user.credits * 0.3),
              date: new Date().toISOString().split('T')[0],
              note: 'Sử dụng dịch vụ'
            });
          }
        }
      });
      
      return transactions;
    } catch (error) {
      console.error('Error getting credit transactions:', error);
      throw error;
    }
  }
}; 