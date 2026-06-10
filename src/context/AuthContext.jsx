import React, { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

// Tạo kênh giao tiếp giữa các tab trình duyệt
const authChannel = new BroadcastChannel('auth_channel');

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

  // Lắng nghe tín hiệu đăng xuất và thay đổi session từ các tab khác
  useEffect(() => {
    // 1. Dùng BroadcastChannel làm kênh truyền tin nhanh
    const handleAuthMessage = (event) => {
      if (event.data === 'logout') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    };
    authChannel.addEventListener('message', handleAuthMessage);

    // 2. Dùng window storage event để lắng nghe thay đổi trực tiếp của localStorage (hữu ích khi login/logout chéo)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token bị xóa ở tab khác -> Logout tab này
          setUser(null);
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        } else if (e.newValue !== e.oldValue) {
          // Token bị thay đổi ở tab khác (đăng nhập tài khoản mới) -> Reload để cập nhật
          window.location.reload();
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      authChannel.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Tự động đồng bộ role/trạng thái từ server khi user focus lại tab
  // Đảm bảo khi Admin thay đổi quyền, user sẽ thấy ngay mà không cần đăng nhập lại
  useEffect(() => {
    if (!user) return;

    const syncUserFromServer = async () => {
      try {
        const response = await api.get('/users/profile');
        const serverUser = response.data.data;
        if (!serverUser) return;

        // Kiểm tra xem tài khoản có bị khóa không
        if (serverUser.is_active === false) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          authChannel.postMessage('logout');
          window.location.href = '/login';
          return;
        }

        // Cập nhật nếu role hoặc thông tin đã thay đổi
        const hasChanges = serverUser.role !== user.role
          || serverUser.full_name !== user.full_name
          || serverUser.email !== user.email;

        if (hasChanges) {
          const updatedUser = { ...user, ...serverUser };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } catch (err) {
        // Token hết hạn hoặc bị revoke → đăng xuất
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          window.location.href = '/login';
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncUserFromServer();
      }
    };

    // Đồng bộ ngay khi component mount (reload trang)
    syncUserFromServer();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id]); // Chỉ re-run khi user id thay đổi (login/logout)

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
    authChannel.postMessage('logout'); // Bắn tín hiệu cho các tab khác biết
  };

  return (
    // Bọc toàn bộ App bằng Provider, cung cấp 'user', hàm 'login', hàm 'logout', 'updateUser' cho bất kỳ component con nào cần dùng
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}