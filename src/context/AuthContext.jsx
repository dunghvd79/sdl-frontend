import React, { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

// 1. TẠO KHO CHỨA (Context) & HOOK TÙY CHỈNH
// Tạo một Context để truyền dữ liệu user đi muôn nơi mà không cần truyền props qua từng lớp
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  // 2. KHÔI PHỤC PHIÊN ĐĂNG NHẬP (Auto Login)
  // Khởi tạo trực tiếp thay vì dùng useEffect để tránh lần render đầu tiên user bị null gây lỗi redirect
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.error('Lỗi parse user từ localStorage', e);
    }
    return null;
  });

  // 3. XỬ LÝ ĐĂNG NHẬP (Lưu dữ liệu)
  const login = async (email, password) => {
    // Sử dụng api instance thay vì axios thô
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    
    // Lưu "chìa khóa" (token) và thông tin user vào Local Storage để tắt tab đi bật lại không bị mất
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData); // Cập nhật state để giao diện React đổi ngay lập tức
  };

  // 3.5. XỬ LÝ CẬP NHẬT THÔNG TIN (Update Profile)
  const updateUser = (newData) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // 4. XỬ LÝ ĐĂNG XUẤT (Xóa dấu vết)
  const logout = () => {
    localStorage.removeItem('token'); // Vứt chìa khóa đi
    localStorage.removeItem('user');  // Xóa thông tin cá nhân
    setUser(null); // Đưa app về trạng thái Khách (Guest)
  };

  return (
    // Bọc toàn bộ App bằng Provider, cung cấp 'user', hàm 'login', hàm 'logout', 'updateUser' cho bất kỳ component con nào cần dùng
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}