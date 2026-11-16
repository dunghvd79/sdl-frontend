import axios from 'axios';
import { withErrorId } from '../utils/errorMessage';

const baseURL = import.meta.env.VITE_API_URL || 'https://sdl-backend.onrender.com/api';

// 1. Instance axios dùng chung. withCredentials: gửi kèm cookie phiên `sdl_rt` (httpOnly) cho /api/auth/*
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instance riêng cho gia hạn phiên: không đi qua interceptor bên dưới (tránh vòng lặp 401 → refresh)
const refreshClient = axios.create({ baseURL, withCredentials: true });

// 2. Request interceptor: tự động gắn access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Gộp gia hạn: nhiều request cùng gặp TOKEN_EXPIRED chỉ gọi /auth/refresh một lần
let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then((response) => {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        if (user) {
          // Giữ các trường giao diện đã lưu, cập nhật role/thông tin mới nhất từ máy chủ
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...stored, ...user }));
        }
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function forceLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login?expired=true';
  }
}

// 3. Response interceptor:
// - 401 TOKEN_EXPIRED → gia hạn rồi gửi lại request (khách không thấy gì)
// - 401 TOKEN_INVALID / TOKEN_MISSING, hoặc gia hạn thất bại → đăng xuất về trang đăng nhập
// - 401 không có `code` (vd sai mật khẩu hiện tại) → chỉ trả lỗi cho trang tự hiển thị, KHÔNG đăng xuất
// - Có `errorId` (lỗi 500) → nối "(Mã lỗi: xxxxxxxx)" vào `error` cho mọi trang (B49)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    // Lỗi hệ thống: gắn mã tham chiếu vào câu báo để khách có mã gửi cho quản trị (B49)
    if (response && response.data) {
      response.data = withErrorId(response.data);
    }
    if (!response || response.status !== 401 || !config) {
      return Promise.reject(error);
    }

    const code = response.data?.code;

    if (code === 'TOKEN_EXPIRED' && !config._retried) {
      config._retried = true;
      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch (refreshError) {
        forceLogout();
        return Promise.reject(error);
      }
    }

    if (code === 'TOKEN_EXPIRED' || code === 'TOKEN_INVALID' || code === 'TOKEN_MISSING') {
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
