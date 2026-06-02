import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [showLoginConfirm, setShowLoginConfirm] = useState(false);

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
      setShowLoginConfirm(true);
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
      <ConfirmDialog
        isOpen={showLoginConfirm}
        title="Yêu cầu đăng nhập"
        message="Vui lòng đăng nhập tài khoản để bắt đầu thêm các tác phẩm yêu thích vào giỏ hàng và mua sắm sách số hóa."
        confirmText="Đăng nhập ngay"
        cancelText="Để sau"
        variant="primary"
        onConfirm={() => {
          setShowLoginConfirm(false);
          navigate('/login');
        }}
        onCancel={() => setShowLoginConfirm(false)}
      />
    </CartContext.Provider>
  );
}