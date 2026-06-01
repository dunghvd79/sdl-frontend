import axios from 'axios';

// 1. Tạo một "bản sao" của axios với cấu hình mặc định
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sdl-backend.onrender.com/api', // Tự động lấy "http://localhost:3000/api" từ file .env, fallback về Render khi deploy
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Interceptor (Người gác cổng): TỰ ĐỘNG GẮN TOKEN
// Trước khi bất kỳ request nào được gửi lên server Node.js, nó sẽ chạy qua đây
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Nếu có token trong máy, tự động nhét vào Header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
