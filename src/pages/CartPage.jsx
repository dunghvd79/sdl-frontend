import React, { useState, useEffect } from 'react';
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

  // State quản lý lựa chọn sản phẩm để thanh toán
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  // State quản lý coupon giảm giá trực tiếp
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

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

  // Fetch danh sách yêu thích (Wishlist) phục vụ tính năng "Lưu lại mua sau"
  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => api.get('/wishlists').then(r => r.data.data),
    enabled: !!user
  });

  // Đồng bộ selectedItems khi cartItems được tải lần đầu
  useEffect(() => {
    if (cartItems.length > 0 && !hasInitializedSelection) {
      const initial = new Set(cartItems.map(item => item.hashId || item.book?.hashId || item.bookId || item.book?.id));
      setSelectedItems(initial);
      setHasInitializedSelection(true);
    }
  }, [cartItems, hasInitializedSelection]);

  // Đồng bộ selectedItems khi giỏ hàng có sự thay đổi (xóa bớt sản phẩm)
  useEffect(() => {
    if (cartItems.length === 0) {
      setSelectedItems(new Set());
      setHasInitializedSelection(false);
    } else {
      const currentBookIds = new Set(cartItems.map(item => item.hashId || item.book?.hashId || item.bookId || item.book?.id));
      setSelectedItems(prev => {
        const next = new Set(prev);
        let changed = false;
        for (const id of next) {
          if (!currentBookIds.has(id)) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [cartItems]);

  // Lọc các item được chọn
  const selectedCartItems = cartItems.filter(item => {
    const bookId = item.hashId || item.book?.hashId || item.bookId || item.book?.id;
    return selectedItems.has(bookId);
  });

  // Tính tổng số tiền và số lượng của các sản phẩm được chọn
  const selectedTotalAmount = selectedCartItems.reduce(
    (sum, item) => sum + Number(item.price || item.book?.price || 0) * item.quantity,
    0
  );

  const selectedTotalQuantity = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Tính toán giảm giá và tổng thanh toán cuối cùng
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotalAmount = Math.max(0, selectedTotalAmount - discountAmount);

  // Tự động kiểm tra / tính toán lại coupon khi số lượng sản phẩm được chọn thay đổi
  useEffect(() => {
    if (appliedCoupon && selectedTotalAmount > 0) {
      const revalidateCoupon = async () => {
        try {
          const response = await api.get(`/coupons/validate?code=${appliedCoupon.code}&orderAmount=${selectedTotalAmount}`);
          setAppliedCoupon(response.data.data);
        } catch (err) {
          setAppliedCoupon(null);
          toast.warning(`Mã giảm giá "${appliedCoupon.code}" đã tự động bị gỡ bỏ do giá trị đơn hàng được chọn không còn đủ điều kiện: ${err.response?.data?.error || err.message}`);
        }
      };
      revalidateCoupon();
    }
  }, [selectedTotalAmount]);

  // 2. Định nghĩa các mutation thay đổi giỏ hàng
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

  // Bulk remove mutation
  const bulkRemoveMutation = useMutation({
    mutationFn: async (bookIds) => {
      return api.post('/cart/remove-bulk', { bookIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cartDetail']);
      fetchCartCount();
      toast.success('Đã xóa các sản phẩm được chọn khỏi giỏ hàng!', { title: 'Đã cập nhật' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi' });
    }
  });

  // Khóa kho kiểm tra và thanh toán
  const checkoutMutation = useMutation({
    mutationFn: async ({ selectedBookIds }) => {
      return api.post('/cart/checkout', { selectedBookIds });
    },
    onSuccess: (res, variables) => {
      toast.success('Thiết lập thanh toán thành công!', { title: 'Khóa giữ kho' });
      queryClient.invalidateQueries(['cartDetail']);
      fetchCartCount();
      navigate('/checkout', {
        state: {
          selectedBookIds: variables.selectedBookIds,
          couponCode: appliedCoupon ? appliedCoupon.code : null
        }
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi thanh toán' });
    }
  });

  // Coupon handling
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.warning('Vui lòng nhập mã giảm giá', { title: 'Lỗi áp dụng mã' });
      return;
    }
    if (selectedTotalAmount === 0) {
      toast.warning('Vui lòng chọn ít nhất một sản phẩm để áp dụng mã giảm giá', { title: 'Lỗi áp dụng mã' });
      return;
    }
    try {
      const response = await api.get(`/coupons/validate?code=${couponCode.trim()}&orderAmount=${selectedTotalAmount}`);
      setAppliedCoupon(response.data.data);
      toast.success(response.data.message || 'Áp dụng mã giảm giá thành công!');
    } catch (err) {
      setAppliedCoupon(null);
      toast.error(err.response?.data?.error || 'Mã giảm giá không hợp lệ', { title: 'Áp dụng mã thất bại' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Đã hủy áp dụng mã giảm giá');
  };

  // Checkbox handlers
  const isAllSelected = cartItems.length > 0 && selectedItems.size === cartItems.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems(new Set());
    } else {
      const allIds = cartItems.map(item => item.hashId || item.book?.hashId || item.bookId || item.book?.id);
      setSelectedItems(new Set(allIds));
    }
  };

  const handleSelectItem = (bookId) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

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

  const handleBulkRemove = () => {
    if (selectedItems.size === 0) return;
    setDialog({
      isOpen: true,
      title: 'Xóa các sản phẩm đã chọn',
      message: `Bạn chắc chắn muốn xóa ${selectedItems.size} sản phẩm đã chọn khỏi giỏ hàng?`,
      confirmText: 'Xóa tất cả',
      cancelText: 'Hủy',
      variant: 'danger',
      onConfirm: () => bulkRemoveMutation.mutate(Array.from(selectedItems))
    });
  };

  // Lưu lại mua sau (Lưu vào Wishlist và xóa khỏi giỏ)
  const handleSaveForLater = async (bookId) => {
    try {
      const isAlreadyLiked = Array.isArray(wishlist) && wishlist.some(w => String(w.hashId || w.id) === String(bookId));
      if (!isAlreadyLiked) {
        await api.post('/wishlists/toggle', { bookId });
        queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
      }
      await removeItemMutation.mutateAsync(bookId);
      toast.success('Đã lưu sách vào danh sách yêu thích để mua sau!', { title: 'Đã lưu lại' });
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi lưu mua sau' });
    }
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán', { title: 'Chưa chọn sản phẩm' });
      return;
    }

    // Kiểm tra xem có sản phẩm được chọn nào vượt quá tồn kho khả dụng hay không
    const selectedWithIssues = selectedCartItems.filter(item => item.quantity > (item.book?.stock || 0));
    if (selectedWithIssues.length > 0) {
      toast.error('Có sản phẩm được chọn vượt quá số lượng khả dụng trong kho!', { title: 'Lỗi tồn kho' });
      return;
    }

    checkoutMutation.mutate({ selectedBookIds: Array.from(selectedItems) });
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
            state={{ scrollTo: 'explore' }}
            className="inline-block bg-ink hover:bg-[#2C4A3B] text-white font-sans text-xs font-bold py-3.5 px-8 uppercase tracking-[0.2em] transition-colors rounded-none"
          >
            Quay lại Cửa hàng
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Danh sách sản phẩm */}
          <div className="flex-1 space-y-4">
            
            {/* Header Chọn tất cả & Xóa bulk */}
            <div className="flex items-center justify-between bg-[#fcfbf9] border border-divider p-4 rounded-none">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-5 h-5 border-divider rounded-none text-[#2C4A3B] focus:ring-[#2C4A3B] cursor-pointer"
                />
                <span className="text-xs font-sans font-bold text-ink uppercase tracking-wider group-hover:text-[#2C4A3B] transition-colors">
                  Chọn tất cả ({cartItems.length} sản phẩm)
                </span>
              </label>
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkRemove}
                  className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  🗑️ Xóa đã chọn ({selectedItems.size})
                </button>
              )}
            </div>

            {/* List Items */}
            <div className="space-y-4">
              {cartItems.map((item) => {
                const bookId = item.hashId || item.book?.hashId || item.bookId || item.book?.id;
                const bookTitle = item.book?.title || 'Cuốn sách';
                const bookAuthor = item.book?.author || 'Tác giả';
                const bookPrice = Number(item.price || item.book?.price || 0);
                const defaultImage = item.book?.cover_url 
                  ? getImageUrl(item.book.cover_url) 
                  : `https://picsum.photos/seed/${bookId + 10}/150/200`;
                const maxStock = item.book?.stock || 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-white border p-4 flex gap-4 items-center rounded-none transition-colors hover:border-ink ${
                      selectedItems.has(bookId) ? 'border-ink bg-white' : 'border-divider'
                    }`}
                  >
                    {/* Checkbox chọn sản phẩm */}
                    <div className="flex-shrink-0 flex items-center justify-center pr-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(bookId)}
                        onChange={() => handleSelectItem(bookId)}
                        className="w-5 h-5 border-divider rounded-none text-[#2C4A3B] focus:ring-[#2C4A3B] cursor-pointer"
                      />
                    </div>

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

                      {/* Lưu mua sau */}
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleSaveForLater(bookId)}
                          className="text-[10px] text-[#2C4A3B] hover:text-[#1e3529] font-sans font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                          title="Lưu vào Wishlist để mua sau"
                        >
                          ❤️ Lưu lại mua sau
                        </button>
                      </div>

                      {/* Hiển thị cảnh báo tồn kho */}
                      {item.quantity > maxStock ? (
                        <p className="text-red-600 text-xs font-semibold mt-2 font-sans">
                          ⚠️ Chỉ còn {maxStock} sản phẩm khả dụng trong kho!
                        </p>
                      ) : item.quantity === maxStock ? (
                        <p className="text-amber-600 text-[11px] font-medium mt-2 font-sans">
                          ⚠️ Đã đạt giới hạn tồn kho khả dụng ({maxStock} cuốn)
                        </p>
                      ) : null}
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
                        disabled={updateQuantityMutation.isPending || item.quantity >= maxStock}
                        className="px-2.5 py-1 text-ink hover:text-[#2C4A3B] font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={item.quantity >= maxStock ? 'Số lượng đạt giới hạn tồn kho khả dụng' : ''}
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
            </div>

            {/* Tiếp tục chọn sách khác */}
            <div className="pt-2">
              <Link
                to="/"
                state={{ scrollTo: 'explore' }}
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
                  <span>Số lượng sản phẩm chọn</span>
                  <span className="font-semibold text-ink">{selectedTotalQuantity} cuốn</span>
                </div>
                <div className="flex justify-between text-xs text-ink-60 uppercase tracking-widest font-sans">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-ink">{selectedTotalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-xs text-[#2C4A3B] font-semibold uppercase tracking-widest font-sans">
                    <span>Mã giảm giá ({appliedCoupon.code})</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-ink-60 uppercase tracking-widest font-sans">
                  <span>Phí vận chuyển</span>
                  <span className="text-[#2C4A3B] font-bold">Miễn phí</span>
                </div>
                
                <div className="border-t border-divider-lt pt-4 flex justify-between font-serif font-bold text-base text-ink uppercase tracking-wide">
                  <span>Tổng cộng</span>
                  <span className="text-[#2C4A3B]">
                    {finalTotalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Nhập mã giảm giá trực tiếp */}
              <div className="border-t border-divider-lt pt-4 mb-6">
                <h4 className="text-xs font-sans font-bold text-ink uppercase tracking-wider mb-2">Mã giảm giá</h4>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-grow border border-divider px-3 py-2 text-xs font-sans tracking-wide rounded-none focus:outline-none focus:border-ink bg-white uppercase"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      className="bg-ink hover:bg-[#2C4A3B] text-white text-[10px] font-sans font-bold uppercase tracking-wider px-4 py-2 transition-colors rounded-none cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#f2faf5] border border-[#d1ebd9] p-3 flex justify-between items-center rounded-none">
                    <div>
                      <p className="text-[10px] text-[#2C4A3B] font-sans font-bold uppercase tracking-widest">Đang áp dụng</p>
                      <p className="text-xs font-serif font-bold text-ink uppercase tracking-wide">{appliedCoupon.code}</p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-red-600 hover:text-red-700 font-sans font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending || selectedItems.size === 0}
                className="w-full bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] text-white font-sans text-xs font-bold py-3.5 px-4 uppercase tracking-[0.2em] transition-colors rounded-none disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer"
              >
                {checkoutMutation.isPending ? '⏳ Đang xử lý...' : '💳 Tiến hành Thanh toán'}
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
