import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  // 1. TẢI DỮ LIỆU GIỎ HÀNG TỪ BACKEND
  const fetchCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const response = await api.get('/cart');
      const items = response.data.data?.items || [];
      const total = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    } catch (err) {
      console.error('Lỗi lấy giỏ hàng:', err);
    }
  };

  // 2. LẮNG NGHE SỰ KIỆN ĐỔI ACC
  useEffect(() => {
    fetchCartCount();
  }, [user]);

  // 3. THAO TÁC THÊM HÀNG VÀO GIỎ
  const addToCart = async (bookId, bookTitle) => {
    if (!user) {
      toast.warning('Bạn cần đăng nhập để thêm sách vào giỏ hàng!', { title: 'Yêu cầu đăng nhập' });
      if (window.confirm('Bạn chưa có tài khoản hoặc chưa đăng nhập!\n\nNhấn "OK" để tới trang Đăng nhập / Đăng ký để mua sách.\nNhấn "Hủy" để tiếp tục xem sách.')) {
        navigate('/login');
      }
      return;
    }
    try {
      await api.post('/cart/add', { bookId, quantity: 1 });
      toast.success(
        bookTitle ? `Đã thêm "${bookTitle}" vào giỏ hàng!` : 'Đã thêm sách vào giỏ hàng!',
        { title: 'Thêm vào giỏ thành công 🛒' }
      );
      fetchCartCount();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, { title: 'Có lỗi xảy ra' });
    }
  };

  return (
    <CartContext.Provider value={{ cartCount, addToCart, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
}