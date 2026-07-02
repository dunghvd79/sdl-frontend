import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { getImageUrl } from '../services/image';
import { 
  Trash2, 
  Heart, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Tag, 
  ArrowLeft, 
  Info, 
  Percent, 
  AlertTriangle, 
  ShieldCheck, 
  Check,
  Ticket,
  X
} from 'lucide-react';

// Key để lưu trạng thái selection vào sessionStorage
const SELECTION_STORAGE_KEY = 'selected_cart_book_ids';

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
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // 1. Fetch chi tiết giỏ hàng
  const { data: cartData, isLoading, isError, refetch } = useQuery({
    queryKey: ['cartDetail'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data.data;
    },
    enabled: !!user
  });

  const cartItems = useMemo(() => cartData?.items || [], [cartData?.items]);

  // Fetch danh sách yêu thích (Wishlist) phục vụ tính năng "Lưu lại mua sau"
  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => api.get('/wishlists').then(r => r.data.data),
    enabled: !!user
  });

  // Fetch danh sách mã giảm giá đang hoạt động
  const { data: couponsData } = useQuery({
    queryKey: ['activeCoupons'],
    queryFn: async () => {
      const response = await api.get('/coupons/active');
      return response.data?.data || [];
    }
  });
  const activeCoupons = couponsData || [];

  // Helper: lấy bookId chuẩn hóa thành string
  const getBookId = (item) => String(item.hashId || item.book?.hashId || item.bookId || item.book?.id);

  // Đồng bộ selectedItems khi cartItems được tải lần đầu
  useEffect(() => {
    if (cartItems.length > 0 && !hasInitializedSelection) {
      const currentIds = cartItems.map(getBookId);
      const currentIdSet = new Set(currentIds);

      // Thử khôi phục từ sessionStorage
      try {
        const saved = sessionStorage.getItem(SELECTION_STORAGE_KEY);
        if (saved) {
          const savedIds = JSON.parse(saved);
          // Chỉ giữ lại các ID còn tồn tại trong giỏ hàng hiện tại
          const restoredIds = savedIds.filter(id => currentIdSet.has(String(id)));
          setSelectedItems(new Set(restoredIds.map(String)));
          setHasInitializedSelection(true);
          return;
        }
      } catch (e) {
        // Nếu parse lỗi, bỏ qua và chọn tất cả
      }

      // Không có dữ liệu saved → chọn tất cả
      setSelectedItems(new Set(currentIds));
      setHasInitializedSelection(true);
    }
  }, [cartItems, hasInitializedSelection]);

  // Lưu selectedItems vào sessionStorage mỗi khi thay đổi
  useEffect(() => {
    if (hasInitializedSelection) {
      sessionStorage.setItem(
        SELECTION_STORAGE_KEY,
        JSON.stringify(Array.from(selectedItems))
      );
    }
  }, [selectedItems, hasInitializedSelection]);

  // Đồng bộ selectedItems khi giỏ hàng có sự thay đổi (xóa bớt sản phẩm)
  useEffect(() => {
    if (cartItems.length === 0) {
      if (selectedItems.size > 0 || hasInitializedSelection) {
        setSelectedItems(new Set());
        setHasInitializedSelection(false);
        sessionStorage.removeItem(SELECTION_STORAGE_KEY);
      }
    } else {
      const currentBookIds = new Set(cartItems.map(getBookId));
      setSelectedItems(prev => {
        const next = new Set(prev);
        let changed = false;
        for (const id of next) {
          if (!currentBookIds.has(String(id))) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [cartItems, hasInitializedSelection, selectedItems.size]);

  // Lọc các item được chọn
  const selectedCartItems = cartItems.filter(item => {
    const bookId = getBookId(item);
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
      const allIds = cartItems.map(getBookId);
      setSelectedItems(new Set(allIds));
    }
  };

  const handleSelectItem = (bookId) => {
    const id = String(bookId);
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
      <div className="max-w-6xl mx-auto py-20 px-4 text-center flex-grow w-full bg-[#fdfcfa]">
        <div className="bg-white border border-divider p-12 text-center rounded-none max-w-lg mx-auto shadow-none">
          <div className="w-16 h-16 bg-[#2C4A3B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="text-[#2C4A3B] w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-ink uppercase tracking-wider mb-3">Bạn chưa đăng nhập</h2>
          <p className="text-stone-500 text-sm font-sans tracking-wide mb-8 leading-relaxed">
            Vui lòng đăng nhập hoặc đăng ký tài khoản để xem giỏ hàng cá nhân, thêm sách yêu thích và thực hiện thanh toán mua sách tại Pigeon Bookstore.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-sans text-xs font-bold py-3.5 px-8 uppercase tracking-[0.2em] transition-colors rounded-none shadow-[0_4px_12px_rgba(44,74,59,0.15)]"
            >
              Đăng nhập ngay
            </Link>
            <Link
              to="/register"
              className="border border-divider hover:border-ink hover:bg-stone-50 text-ink font-sans text-xs font-bold py-3.5 px-8 uppercase tracking-[0.2em] transition-colors rounded-none bg-white"
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
      <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full bg-[#fdfcfa]">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-[#f0ece7] mx-auto md:mx-0"></div>
          <div className="h-10 w-64 bg-[#f0ece7] mx-auto md:mx-0"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-16 bg-[#f0ece7]"></div>
              <div className="h-32 bg-[#f0ece7]"></div>
              <div className="h-32 bg-[#f0ece7]"></div>
            </div>
            <div className="lg:col-span-4 h-60 bg-[#f0ece7]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4 text-center flex-grow w-full bg-[#fdfcfa]">
        <div className="bg-white border border-divider p-10 inline-block rounded-none max-w-md">
          <p className="text-sm font-serif font-bold text-ink mb-6">❌ Không thể kết nối và tải thông tin giỏ hàng.</p>
          <button 
            onClick={() => refetch()} 
            className="bg-ink hover:bg-[#2C4A3B] text-white text-[10px] font-bold uppercase tracking-widest px-8 py-3.5 rounded-none transition-colors cursor-pointer"
          >
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full bg-[#fdfcfa]">
      
      {/* Checkout Steps Stepper (Progress Bar) */}
      <div className="flex justify-center items-center gap-2 mb-10 text-xs font-sans uppercase tracking-widest font-semibold max-w-md mx-auto">
        <span className="text-[#2C4A3B] border-b-2 border-[#2C4A3B] pb-1 font-bold">1. Giỏ hàng</span>
        <span className="text-stone-300">/</span>
        <span className="text-stone-400">2. Thanh toán</span>
        <span className="text-stone-300">/</span>
        <span className="text-stone-400">3. Hoàn tất</span>
      </div>

      {/* Header */}
      <div className="mb-10 border-b border-divider pb-6 text-center md:text-left flex flex-col md:flex-row md:items-baseline justify-between gap-4">
        <div>
          <span className="text-[10px] text-stone-500 font-sans tracking-[0.2em] uppercase font-bold">Xem giỏ hàng của bạn</span>
          <h1 className="text-3xl font-serif font-bold text-ink mt-1 flex items-center justify-center md:justify-start gap-2.5">
            <ShoppingBag className="text-[#2C4A3B] w-7 h-7" /> GIỎ HÀNG
          </h1>
        </div>
        {cartItems.length > 0 && (
          <span className="text-xs text-stone-500 font-sans">
            Bạn đang có <strong className="text-ink">{cartItems.length}</strong> tác phẩm trong giỏ
          </span>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white border border-divider p-16 text-center rounded-none shadow-none max-w-xl mx-auto">
          <div className="w-16 h-16 bg-[#2C4A3B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="text-[#2C4A3B] w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-ink uppercase tracking-wider mb-2">Giỏ hàng của bạn đang trống</h2>
          <p className="text-stone-500 text-sm font-sans tracking-wide mb-8">Hãy tiếp tục khám phá kho tàng tri thức với hàng ngàn cuốn sách hấp dẫn của chúng tôi nhé!</p>
          <Link
            to="/"
            state={{ scrollTo: 'explore' }}
            className="inline-block bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-sans text-xs font-bold py-3.5 px-8 uppercase tracking-[0.2em] transition-colors rounded-none shadow-[0_4px_12px_rgba(44,74,59,0.15)]"
          >
            Quay lại Cửa hàng
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cột trái (7 cột): Danh sách sản phẩm */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Header Chọn tất cả & Xóa bulk */}
            <div className="flex items-center justify-between bg-[#faf8f5] border border-divider p-4 rounded-none">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-[#2C4A3B] cursor-pointer"
                />
                <span className="text-xs font-sans font-bold text-ink uppercase tracking-wider group-hover:text-[#2C4A3B] transition-colors">
                  Chọn tất cả ({cartItems.length} sản phẩm)
                </span>
              </label>
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkRemove}
                  className="text-[10px] text-red-600 hover:text-red-700 font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
                >
                  <Trash2 size={13} /> Xóa đã chọn ({selectedItems.size})
                </button>
              )}
            </div>

            {/* List Items */}
            <div className="space-y-4">
              {cartItems.map((item) => {
                const bookId = getBookId(item);
                const bookTitle = item.book?.title || 'Cuốn sách';
                const bookAuthor = item.book?.author || 'Tác giả';
                const bookPrice = Number(item.price || item.book?.price || 0);
                const defaultImage = item.book?.cover_url 
                  ? getImageUrl(item.book.cover_url) 
                  : `https://picsum.photos/seed/${bookId}/150/200`;
                const maxStock = item.book?.stock || 0;
                const isSelected = selectedItems.has(bookId);

                return (
                  <div
                    key={item.id}
                    className={`bg-white border p-4 flex flex-col sm:flex-row gap-4 sm:items-center rounded-none transition-all hover:shadow-[0_4px_15px_rgba(44,74,59,0.03)] group/item relative ${
                      isSelected ? 'border-[#2C4A3B] bg-[#fdfbf9]/30' : 'border-divider'
                    }`}
                  >
                    {/* Checkbox, Image and Text in a flex row */}
                    <div className="flex gap-3 items-center flex-grow min-w-0 w-full sm:w-auto">
                      {/* Checkbox chọn sản phẩm */}
                      <div className="flex-shrink-0 flex items-center justify-center pr-1 select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(bookId)}
                          className="w-4.5 h-4.5 accent-[#2C4A3B] cursor-pointer"
                        />
                      </div>

                      {/* Book Cover Image */}
                      <div className="w-16 h-22 bg-[#faf8f5] border border-divider-lt rounded-none flex-shrink-0 overflow-hidden shadow-sm relative">
                        <img
                          src={defaultImage}
                          alt={bookTitle}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                        />
                      </div>
                      
                      {/* Book Text Info */}
                      <div className="flex-grow min-w-0">
                        <Link
                          to={`/books/${bookId}`}
                          className="font-serif font-bold text-sm sm:text-base text-ink hover:text-[#2C4A3B] transition-colors line-clamp-1 leading-snug"
                        >
                          {bookTitle}
                        </Link>
                        <p className="text-[9px] text-stone-500 font-sans uppercase tracking-widest mt-0.5 font-bold line-clamp-1">{bookAuthor}</p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          {/* Lưu mua sau */}
                          <button
                            onClick={() => handleSaveForLater(bookId)}
                            className="text-[10px] text-stone-400 hover:text-rose-600 font-sans font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors bg-transparent border-0"
                            title="Lưu vào Wishlist để mua sau và gỡ khỏi giỏ hàng"
                          >
                            <Heart size={11} className="fill-none" /> Lưu lại mua sau
                          </button>
                        </div>

                        {/* Hiển thị cảnh báo tồn kho */}
                        {item.quantity > maxStock ? (
                          <div className="bg-red-50 text-red-800 border border-red-200/50 p-2 text-[10px] font-sans font-semibold mt-2.5 flex items-center gap-1.5 leading-none">
                            <AlertTriangle size={12} /> Chỉ còn {maxStock} sản phẩm khả dụng trong kho!
                          </div>
                        ) : item.quantity === maxStock ? (
                          <div className="bg-amber-50/50 text-amber-800 border border-amber-200/50 p-2 text-[10px] font-sans font-semibold mt-2.5 flex items-center gap-1.5 leading-none">
                            <AlertTriangle size={12} /> Đã đạt giới hạn tồn kho khả dụng ({maxStock} cuốn)
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Cụm giá tiền & Tăng/giảm số lượng */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-divider-lt flex-shrink-0">
                      <p className="text-[#2C4A3B] font-serif font-bold text-sm sm:text-base font-mono">
                        {(bookPrice * item.quantity).toLocaleString('vi-VN')} đ
                      </p>
                      
                      <div className="flex items-center border border-divider bg-[#faf8f5] p-0.5 rounded-none">
                        <button
                          onClick={() => handleQuantityChange(bookId, item.quantity, -1)}
                          disabled={updateQuantityMutation.isPending}
                          className="w-7 h-7 flex items-center justify-center text-ink hover:text-[#2C4A3B] hover:bg-stone-100 font-bold text-xs disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          <Minus size={10} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center font-mono text-ink text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(bookId, item.quantity, 1)}
                          disabled={updateQuantityMutation.isPending || item.quantity >= maxStock}
                          className="w-7 h-7 flex items-center justify-center text-ink hover:text-[#2C4A3B] hover:bg-stone-100 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          title={item.quantity >= maxStock ? 'Số lượng đạt giới hạn tồn kho khả dụng' : ''}
                        >
                          <Plus size={10} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Nút Xóa riêng biệt */}
                    <div className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto sm:pl-1 sm:border-l sm:border-divider-lt sm:self-stretch flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveItem(bookId)}
                        disabled={removeItemMutation.isPending}
                        className="p-2 text-stone-400 hover:text-red-600 transition-colors cursor-pointer bg-transparent border-0"
                        title="Xóa tác phẩm khỏi giỏ hàng"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tiếp tục chọn sách khác */}
            <div className="pt-2">
              <Link
                to="/"
                state={{ scrollTo: 'explore' }}
                className="inline-flex items-center gap-1.5 border border-divider hover:border-ink hover:bg-stone-50 text-stone-700 hover:text-ink font-sans text-xs font-bold py-3.5 px-6 uppercase tracking-[0.15em] transition-all rounded-none bg-white cursor-pointer"
              >
                <ArrowLeft size={13} /> Tiếp tục mua thêm sách
              </Link>
            </div>

          </div>

          {/* Cột phải (4 cột): Tóm tắt Đơn hàng & Thanh toán */}
          <div className="lg:col-span-4 w-full sticky top-24 space-y-6">
            
            {/* Tóm tắt */}
            <div className="bg-[#faf8f5] border border-divider p-6 rounded-none space-y-5">
              <h3 className="font-serif text-sm font-bold text-ink uppercase tracking-widest pb-3.5 border-b border-divider">
                Tóm tắt đơn hàng
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between text-stone-500 uppercase tracking-wider">
                  <span>Số lượng sách chọn</span>
                  <span className="font-bold text-ink font-mono">{selectedTotalQuantity} cuốn</span>
                </div>
                <div className="flex justify-between text-stone-500 uppercase tracking-wider">
                  <span>Tạm tính</span>
                  <span className="font-bold text-ink font-mono">{selectedTotalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-[#2C4A3B] font-bold uppercase tracking-wider bg-green-50 p-2 border border-green-200">
                    <span>Mã giảm giá ({appliedCoupon.code})</span>
                    <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                
                <div className="flex justify-between text-stone-500 uppercase tracking-wider">
                  <span>Phí vận chuyển</span>
                  <span className="text-[#2C4A3B] font-bold uppercase tracking-wider text-[10px]">Miễn phí</span>
                </div>
                
                <div className="border-t border-divider pt-4 flex justify-between items-baseline font-serif font-bold text-base text-ink uppercase tracking-wide">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#2C4A3B] font-mono text-lg">
                    {finalTotalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Nhập mã giảm giá trực tiếp */}
              <div className="border-t border-divider pt-4 space-y-2.5">
                <label className="text-[10px] font-sans font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={13} /> Mã giảm giá (Voucher)
                </label>
                {!appliedCoupon ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ví dụ: GIAM20K"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-grow border border-divider px-3.5 py-2 text-xs font-sans tracking-wide rounded-none focus:outline-none focus:border-[#2C4A3B] bg-white uppercase font-mono placeholder-stone-400"
                      />
                      <button
                        onClick={handleValidateCoupon}
                        className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white text-[10px] font-sans font-bold uppercase tracking-widest px-4 py-2 transition-colors rounded-none cursor-pointer"
                      >
                        Áp dụng
                      </button>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => setIsVoucherModalOpen(true)}
                        className="text-[9px] text-[#2C4A3B] hover:underline uppercase tracking-wider font-bold bg-transparent border-0 cursor-pointer p-0"
                      >
                        Chọn từ danh sách ưu đãi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50/50 border border-green-200 p-3 flex justify-between items-center rounded-none text-xs">
                    <div>
                      <p className="text-[9px] text-[#2C4A3B] font-sans font-bold uppercase tracking-widest">Đang áp dụng</p>
                      <p className="font-serif font-bold text-ink uppercase tracking-wide">{appliedCoupon.code}</p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-red-600 hover:text-red-700 font-sans font-bold uppercase tracking-wider cursor-pointer bg-transparent border-0"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                )}
              </div>

              {/* Bảo mật thông tin */}
              <div className="p-3 bg-stone-50 border border-divider-lt rounded-none flex gap-2 text-[10px] text-stone-500 leading-relaxed">
                <ShieldCheck size={14} className="text-[#2C4A3B] flex-shrink-0" />
                <p>
                  Sản phẩm được chọn sẽ được giữ kho tạm thời cho bạn trong quá trình thực hiện thủ tục thanh toán.
                </p>
              </div>

              {/* Nút hành động */}
              <button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending || selectedItems.size === 0}
                className="w-full bg-[#2C4A3B] hover:bg-[#1e3529] active:bg-[#1e3529] text-white font-sans text-xs font-bold py-3.5 px-4 uppercase tracking-[0.2em] transition-colors rounded-none disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer shadow-[0_3px_12px_rgba(44,74,59,0.15)] flex items-center justify-center gap-1.5"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                    Đang xử lý khóa kho...
                  </>
                ) : (
                  <>💳 Tiến hành Thanh toán</>
                )}
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

      {/* Cửa sổ chọn mã giảm giá (Voucher Picker Modal) */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div 
            className="bg-white border border-divider w-full max-w-lg shadow-2xl relative flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-divider flex items-center justify-between bg-[#faf8f5]">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-[#2C4A3B]" />
                <h3 className="font-serif font-bold text-ink uppercase tracking-widest text-sm">
                  Kho Voucher ưu đãi
                </h3>
              </div>
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors p-1 cursor-pointer bg-transparent border-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-grow max-h-[60vh] custom-scrollbar bg-stone-50/50">
              {/* Nhập mã nhanh trong modal */}
              <div className="bg-white border border-divider p-3.5 space-y-2 mb-2">
                <p className="text-[9px] font-sans font-bold text-stone-500 uppercase tracking-widest">Nhập mã ưu đãi khác</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: PIGEON50K"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-grow border border-divider px-3 py-1.5 text-xs font-sans tracking-wide rounded-none focus:outline-none focus:border-[#2C4A3B] uppercase font-mono bg-[#faf8f5] h-9"
                  />
                  <button
                    onClick={() => {
                      handleValidateCoupon();
                      setIsVoucherModalOpen(false);
                    }}
                    className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white text-[9px] font-sans font-bold uppercase tracking-widest px-4.5 py-1.5 transition-colors rounded-none cursor-pointer border-0"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              {/* Danh sách Voucher */}
              {activeCoupons.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">
                  Hiện không có mã giảm giá nào khả dụng trên hệ thống.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Nhóm đủ điều kiện và không đủ điều kiện */}
                  {(() => {
                    const eligible = activeCoupons.filter(c => !c.is_used && selectedTotalAmount >= Number(c.min_order_amount));
                    const ineligible = activeCoupons.filter(c => c.is_used || selectedTotalAmount < Number(c.min_order_amount));

                    return (
                      <>
                        {eligible.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-sans font-bold text-[#2C4A3B] uppercase tracking-wider">
                              Voucher có thể áp dụng ({eligible.length})
                            </h4>
                            {eligible.map((coupon) => {
                              const valueStr = coupon.discount_type === 'PERCENT' 
                                ? `${coupon.discount_value}%` 
                                : `${Number(coupon.discount_value).toLocaleString('vi-VN')} đ`;
                              const maxStr = coupon.discount_type === 'PERCENT' && coupon.max_discount_amount
                                ? ` (Tối đa ${Number(coupon.max_discount_amount).toLocaleString('vi-VN')} đ)`
                                : '';

                              return (
                                <div 
                                  key={coupon.id}
                                  className="bg-white border-2 border-dashed border-green-200 p-4 flex items-center justify-between gap-4 transition-all hover:border-[#2C4A3B] hover:shadow-xs relative overflow-hidden group rounded-none"
                                >
                                  {/* Left visual representation */}
                                  <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#2C4A3B]"></div>
                                  
                                  <div className="pl-2 space-y-1 text-left flex-grow">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-ink text-[11px] bg-green-50 text-[#2C4A3B] px-2 py-0.5 border border-green-150 rounded-none">
                                        {coupon.code}
                                      </span>
                                    </div>
                                    <p className="text-xs font-serif font-bold text-ink leading-tight">
                                      Giảm {valueStr}{maxStr} cho đơn từ {Number(coupon.min_order_amount).toLocaleString('vi-VN')} đ
                                    </p>
                                    <p className="text-[9px] text-stone-400 font-sans">
                                      Hạn sử dụng: {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                                    </p>
                                  </div>

                                  <button
                                    onClick={async () => {
                                      setCouponCode(coupon.code);
                                      try {
                                        const response = await api.get(`/coupons/validate?code=${coupon.code}&orderAmount=${selectedTotalAmount}`);
                                        setAppliedCoupon(response.data.data);
                                        toast.success(response.data.message || 'Áp dụng mã giảm giá thành công!');
                                      } catch (err) {
                                        setAppliedCoupon(null);
                                        toast.error(err.response?.data?.error || 'Mã giảm giá không hợp lệ', { title: 'Áp dụng mã thất bại' });
                                      }
                                      setIsVoucherModalOpen(false);
                                    }}
                                    className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white text-[9px] font-sans font-bold uppercase tracking-widest px-4 py-2 transition-colors rounded-none cursor-pointer flex-shrink-0 border-0"
                                  >
                                    Áp dụng
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {ineligible.length > 0 && (
                          <div className="space-y-2.5 pt-2">
                            <h4 className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-wider">
                              Voucher chưa đủ điều kiện ({ineligible.length})
                            </h4>
                            {ineligible.map((coupon) => {
                              const valueStr = coupon.discount_type === 'PERCENT' 
                                ? `${coupon.discount_value}%` 
                                : `${Number(coupon.discount_value).toLocaleString('vi-VN')} đ`;
                              const maxStr = coupon.discount_type === 'PERCENT' && coupon.max_discount_amount
                                ? ` (Tối đa ${Number(coupon.max_discount_amount).toLocaleString('vi-VN')} đ)`
                                : '';
                              
                              const minAmt = Number(coupon.min_order_amount);
                              const diff = minAmt - selectedTotalAmount;

                              return (
                                <div 
                                  key={coupon.id}
                                  className="bg-stone-50 border border-divider p-4 flex items-center justify-between gap-4 opacity-75 relative overflow-hidden rounded-none"
                                >
                                  <div className="absolute top-0 bottom-0 left-0 w-2 bg-stone-300"></div>
                                  
                                  <div className="pl-2 space-y-1 text-left flex-grow">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-stone-500 text-[11px] bg-stone-100 px-2 py-0.5 border border-stone-200 rounded-none">
                                        {coupon.code}
                                      </span>
                                      {coupon.is_used && (
                                        <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 font-sans font-bold uppercase tracking-wider px-1.5 py-0.5">
                                          Đã sử dụng
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs font-serif font-bold text-stone-600 leading-tight">
                                      Giảm {valueStr}{maxStr} cho đơn từ {minAmt.toLocaleString('vi-VN')} đ
                                    </p>
                                    
                                    {!coupon.is_used && diff > 0 && (
                                      <p className="text-[10px] text-amber-700 font-sans font-semibold flex items-center gap-1">
                                        <AlertTriangle size={11} className="flex-shrink-0" /> Mua thêm {diff.toLocaleString('vi-VN')} đ để áp dụng
                                      </p>
                                    )}
                                    
                                    <p className="text-[9px] text-stone-400 font-sans">
                                      Hạn sử dụng: {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                                    </p>
                                  </div>

                                  <button
                                    disabled
                                    className="bg-stone-200 text-stone-400 text-[9px] font-sans font-bold uppercase tracking-widest px-4 py-2 rounded-none cursor-not-allowed flex-shrink-0 border-0"
                                  >
                                    Áp dụng
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-divider bg-[#faf8f5] text-right">
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="border border-divider hover:border-ink hover:bg-stone-150 text-stone-700 hover:text-ink text-[10px] font-sans font-bold uppercase tracking-widest px-5 py-2.5 transition-colors rounded-none cursor-pointer bg-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

