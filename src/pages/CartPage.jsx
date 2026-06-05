import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { getImageUrl } from '../services/image';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { fetchCartCount } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  
  // State quản lý Hộp thoại xác nhận
  const [dialog, setDialog] = useState({ isOpen: false });

  // 1. Fetch chi tiết giỏ hàng
  const { data: cartData, isLoading, isError, refetch } = useQuery({
    queryKey: ['cartDetail'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data.data;
    },
    enabled: !!user
  });

  const cartItems = cartData?.items || [];

  // Tính tổng số tiền trong giỏ
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price || item.book?.price || 0) * item.quantity,
    0
  );

  // 2. Định nghĩa các mutation để thay đổi giỏ hàng
  // Thay đổi số lượng (tăng/giảm)
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ bookId, quantity }) => {
      return api.post('/cart/add', { bookId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cartDetail']);
      fetchCartCount();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi' });
    }
  });

  // Xóa sản phẩm khỏi giỏ hàng
  const removeItemMutation = useMutation({
    mutationFn: async (bookId) => {
      return api.delete(`/cart/remove/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cartDetail']);
      fetchCartCount();
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng!', { title: 'Đã cập nhật' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi' });
    }
  });

  // Khóa kho và chuẩn bị thanh toán
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      return api.post('/cart/checkout');
    },
    onSuccess: (res) => {
      toast.success('Đơn hàng đã được thiết lập thành công!', { title: 'Khóa kho giữ sách' });
      queryClient.invalidateQueries(['cartDetail']);
      fetchCartCount();
      navigate('/checkout');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi thanh toán' });
    }
  });

  const handleQuantityChange = (bookId, currentQty, delta) => {
    if (currentQty + delta <= 0) {
      setDialog({
        isOpen: true,
        title: 'Xóa sản phẩm',
        message: 'Bạn có muốn xóa cuốn sách này khỏi giỏ hàng?',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        variant: 'danger',
        onConfirm: () => removeItemMutation.mutate(bookId)
      });
    } else {
      updateQuantityMutation.mutate({ bookId, quantity: delta });
    }
  };

  const handleRemoveItem = (bookId) => {
    setDialog({
      isOpen: true,
      title: 'Xóa sản phẩm',
      message: 'Bạn chắc chắn muốn xóa cuốn sách này khỏi giỏ hàng?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'danger',
      onConfirm: () => removeItemMutation.mutate(bookId)
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    checkoutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="bg-white border border-divider p-12 text-center rounded-none max-w-lg mx-auto">
          <div className="text-5xl mb-4 opacity-80">🛒</div>
          <h2 className="text-2xl font-serif font-bold text-ink uppercase tracking-wider mb-3">Bạn chưa đăng nhập</h2>
          <p className="text-ink-60 text-sm font-sans tracking-wide mb-8 leading-relaxed">
            Vui lòng đăng nhập hoặc đăng ký tài khoản để xem giỏ hàng cá nhân, thêm sách yêu thích và thực hiện thanh toán mua sách tại Pigeon Bookstore.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-sans text-xs font-bold py-3.5 px-8 uppercase tracking-[0.2em] transition-colors rounded-none"
            >
              Đăng nhập ngay
            </Link>
            <Link
              to="/register"
              className="border border-divider hover:border-ink hover:bg-surface-warm text-ink font-sans text-xs font-bold py-3.5 px-8 uppercase tracking-[0.2em] transition-colors rounded-none bg-white"
            >
              Đăng ký tài khoản
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 flex-grow w-full">
        <h1 className="text-3xl font-serif font-bold text-ink uppercase tracking-widest mb-8">🛒 Giỏ Hàng</h1>
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-surface-subtle rounded-none"></div>
          <div className="h-20 bg-surface-subtle rounded-none"></div>
          <div className="h-20 bg-surface-subtle rounded-none"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="bg-white border border-divider p-8 inline-block rounded-none max-w-md">
          <p className="text-lg font-serif font-bold text-ink mb-4">❌ Không thể tải thông tin giỏ hàng.</p>
          <button 
            onClick={() => refetch()} 
            className="bg-ink hover:bg-[#2C4A3B] text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-none transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 flex-grow w-full">
      <h1 className="text-3xl font-serif font-bold text-ink uppercase tracking-widest mb-8">🛒 Giỏ Hàng</h1>

      {cartItems.length === 0 ? (
        <div className="bg-white border border-divider p-12 text-center rounded-none">
          <div className="text-5xl mb-4 opacity-80">🛒</div>
          <h2 className="text-2xl font-serif font-bold text-ink uppercase tracking-wider mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-ink-60 text-sm font-sans tracking-wide mb-8">Hãy khám phá thêm hàng ngàn cuốn sách hấp dẫn khác tại thư viện nhé!</p>
          <Link
            to="/"
            className="inline-block bg-ink hover:bg-[#2C4A3B] text-white font-sans text-xs font-bold py-3.5 px-8 uppercase tracking-[0.2em] transition-colors rounded-none"
          >
            Quay lại Cửa hàng
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Danh sách sản phẩm */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => {
              const bookId = item.hashId || item.book?.hashId || item.bookId || item.book?.id;
              const bookTitle = item.book?.title || 'Cuốn sách';
              const bookAuthor = item.book?.author || 'Tác giả';
              const bookPrice = Number(item.price || item.book?.price || 0);
              const defaultImage = item.book?.cover_url 
                ? getImageUrl(item.book.cover_url) 
                : `https://picsum.photos/seed/${bookId + 10}/150/200`;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-divider p-4 flex gap-4 items-center rounded-none hover:border-ink transition-colors"
                >
                  <img
                    src={defaultImage}
                    alt={bookTitle}
                    className="w-16 h-22 object-cover border border-divider-lt rounded-none flex-shrink-0 aspect-[3/4]"
                  />
                  <div className="flex-grow min-w-0">
                    <Link
                      to={`/books/${bookId}`}
                      className="font-serif font-bold text-base text-ink hover:text-[#2C4A3B] transition-colors line-clamp-1"
                    >
                      {bookTitle}
                    </Link>
                    <p className="text-ink-60 text-xs font-sans uppercase tracking-widest mt-1 line-clamp-1">{bookAuthor}</p>
                    <p className="text-[#2C4A3B] font-serif font-bold text-sm mt-2">
                      {bookPrice.toLocaleString('vi-VN')} đ
                    </p>
                  </div>

                  {/* Cụm tăng/giảm số lượng */}
                  <div className="flex items-center border border-divider bg-[#fcfbf9] p-0.5 flex-shrink-0 rounded-none">
                    <button
                      onClick={() => handleQuantityChange(bookId, item.quantity, -1)}
                      disabled={updateQuantityMutation.isPending}
                      className="px-2.5 py-1 text-ink hover:text-[#2C4A3B] font-bold text-xs disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 font-mono text-ink text-xs w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(bookId, item.quantity, 1)}
                      disabled={updateQuantityMutation.isPending}
                      className="px-2.5 py-1 text-ink hover:text-[#2C4A3B] font-bold text-xs disabled:opacity-30 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Nút Xóa */}
                  <button
                    onClick={() => handleRemoveItem(bookId)}
                    disabled={removeItemMutation.isPending}
                    className="p-2 text-ink-60 hover:text-red-600 transition-colors cursor-pointer"
                    title="Xóa sản phẩm"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}

            {/* Tiếp tục chọn sách khác */}
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 border border-[#2C4A3B]/30 hover:border-[#2C4A3B] hover:bg-[#faf8f5] text-[#2C4A3B] font-sans text-xs font-bold py-3 px-6 uppercase tracking-[0.15em] transition-all rounded-none bg-white cursor-pointer"
              >
                ← Tiếp tục chọn sách khác
              </Link>
            </div>
          </div>

          {/* Cột Tóm tắt Đơn hàng & Thanh toán */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white border border-divider p-6 rounded-none sticky top-24">
              <h3 className="font-serif text-lg font-bold text-ink uppercase tracking-wider mb-4 pb-4 border-b border-divider-lt">
                Tóm tắt đơn hàng
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-xs text-ink-60 uppercase tracking-widest font-sans">
                  <span>Tổng số lượng</span>
                  <span className="font-semibold text-ink">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} cuốn</span>
                </div>
                <div className="flex justify-between text-xs text-ink-60 uppercase tracking-widest font-sans">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-ink">{totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-xs text-ink-60 uppercase tracking-widest font-sans">
                  <span>Phí vận chuyển</span>
                  <span className="text-[#2C4A3B] font-bold">Miễn phí</span>
                </div>
                <div className="border-t border-divider-lt pt-4 flex justify-between font-serif font-bold text-base text-ink uppercase tracking-wide">
                  <span>Tổng cộng</span>
                  <span className="text-[#2C4A3B]">
                    {totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
                className="w-full bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] text-white font-sans text-xs font-bold py-3.5 px-4 uppercase tracking-[0.2em] transition-colors rounded-none disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                {checkoutMutation.isPending ? '⏳ Đang xử lý khóa kho...' : '💳 Tiến hành Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận */}
      <ConfirmDialog
        {...dialog}
        onCancel={() => setDialog({ isOpen: false })}
      />
    </div>
  );
}
