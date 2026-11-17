import React, { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';
import { clearPersonalData, clearOtherUsersData } from '../utils/userStorage';

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
        clearPersonalData(); // B54: xoá cả dữ liệu cá nhân, không chỉ token
        setUser(null);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    };
    authChannel.addEventListener('message', handleAuthMessage);

    // 2. Dùng window storage event để lắng nghe đăng nhập/đăng xuất chéo tab.
    // Chỉ theo dõi khoá 'user': khoá 'token' đổi mỗi lần tự gia hạn (~15 phút) nên KHÔNG được tải lại trang theo nó.
    const handleStorageChange = (e) => {
      if (e.key !== 'user') return;
      if (!e.newValue) {
        // User bị xóa ở tab khác -> Logout tab này
        setUser(null);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return;
      }
      try {
        const oldId = e.oldValue ? JSON.parse(e.oldValue).id : null;
        const newId = JSON.parse(e.newValue).id;
        if (oldId !== newId) {
          // Tab khác đăng nhập tài khoản khác -> Reload để cập nhật
          window.location.reload();
        }
      } catch {
        // Dữ liệu hỏng: bỏ qua
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
          clearPersonalData();
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
          clearPersonalData();
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
  // Lưu phiên máy chủ vừa cấp (đăng nhập hoặc đăng ký) — response dạng { token, user }
  const startSession = ({ token, user: userData }) => {
    // Người trước tắt trình duyệt mà không đăng xuất: xoá dữ liệu cá nhân của tài khoản khác còn sót (B54)
    clearOtherUsersData(userData?.id);

    // Lưu "chìa khóa" (token) và thông tin user vào Local Storage để tắt tab đi bật lại không bị mất
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData); // Cập nhật state để giao diện React đổi ngay lập tức
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    startSession(response.data);
  };

  // 3.1. ĐĂNG KÝ: máy chủ tạo tài khoản và cấp phiên luôn → dùng thẳng, không gọi thêm /auth/login (B57)
  const register = async ({ email, password, fullName }) => {
    const response = await api.post('/auth/register', { email, password, fullName });
    startSession(response.data);
  };

  // 3.2. ĐĂNG NHẬP BẰNG GOOGLE (spec 005): gửi ID token Google, máy chủ trả phiên giống /auth/login
  const loginWithGoogle = async (credential) => {
    const response = await api.post('/auth/google', { credential });
    startSession(response.data);
  };

  // 3.5. XỬ LÝ CẬP NHẬT THÔNG TIN (Update Profile)
  const updateUser = (newData) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Lưu access token mới do máy chủ cấp (vd sau khi đổi mật khẩu, mọi phiên cũ bị huỷ)
  const setAccessToken = (token) => {
    if (token) localStorage.setItem('token', token);
  };

  // Xoá dữ liệu đăng nhập trên máy và báo các tab khác
  const clearLocalSession = () => {
    clearPersonalData(); // Xoá token, user và mọi dữ liệu cá nhân trên máy (B54)
    setUser(null); // Đưa app về trạng thái Khách (Guest)
    authChannel.postMessage('logout'); // Bắn tín hiệu cho các tab khác biết
  };

  // 4. XỬ LÝ ĐĂNG XUẤT: huỷ phiên ở máy chủ (cookie sdl_rt) rồi xoá dấu vết trên máy.
  // Lỗi mạng khi gọi API không chặn việc đăng xuất trên máy.
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Không huỷ được phiên trên máy chủ:', err.message);
    }
    clearLocalSession();
  };

  // 5. ĐĂNG XUẤT MỌI NƠI: huỷ mọi phiên của tài khoản trên mọi thiết bị
  const logoutAll = async () => {
    await api.post('/auth/logout-all');
    clearLocalSession();
  };

  return (
    // Bọc toàn bộ App bằng Provider, cung cấp thông tin đăng nhập và các hàm xử lý cho component con
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, logoutAll, updateUser, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}