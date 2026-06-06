import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../services/image';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

const CANCEL_REASONS = [
  'Tôi muốn thay đổi địa chỉ nhận hàng hoặc số điện thoại',
  'Tôi muốn đổi phương thức thanh toán hoặc áp dụng mã giảm giá khác',
  'Tôi đặt trùng đơn hoặc không còn nhu cầu mua nữa',
  'Tìm thấy mức giá rẻ hơn ở nơi khác',
  'Thời gian giao nhận dự kiến quá lâu',
  'Lý do khác (Vui lòng ghi chi tiết bên dưới)'
];

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { fetchCartCount } = useCart();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderIdToCancel, setOrderIdToCancel] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedReviewBook, setSelectedReviewBook] = useState(null);

  // 1. Fetch danh sách đơn hàng của tôi
  const { data: ordersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data.data;
    },
    enabled: !!user
  });

  const orders = ordersData || [];

  // 2. Mutation để thanh toán lại đơn hàng PENDING
  const payMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await api.get(`/payments/url/${orderId}`);
      return response.data.paymentUrl;
    },
    onSuccess: (paymentUrl) => {
      window.location.href = paymentUrl;
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi thanh toán' });
    }
  });

  const handlePayNow = (orderId) => {
    payMutation.mutate(orderId);
  };

  const reorderMutation = useMutation({
    mutationFn: async (items) => {
      const payload = items.map(item => ({ bookId: item.hashId || item.bookId, quantity: item.quantity }));
      return api.post('/cart/add-batch', { items: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cartDetail']);
      fetchCartCount();
      toast.success('Đã thêm toàn bộ sản phẩm của đơn cũ vào giỏ hàng!', { title: 'Mua lại thành công 🛒' });
      navigate('/cart');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi mua lại' });
    }
  });

  const handleReorder = (items) => {
    if (!items || items.length === 0) {
      toast.warning('Đơn hàng không có sản phẩm nào để mua lại!', { title: 'Lỗi mua lại' });
      return;
    }
    reorderMutation.mutate(items);
  };

  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, cancelReason }) => {
      const response = await api.put(`/orders/${orderId}/cancel`, { cancelReason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myOrders']);
      toast.success('Hủy đơn hàng thành công!', { title: 'Đã hủy đơn hàng' });
      setIsCancelModalOpen(false);
      setOrderIdToCancel(null);
      setSelectedReason('');
      setCustomReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi hủy đơn hàng' });
    }
  });

  const handleConfirmCancel = () => {
    if (!orderIdToCancel) return;
    
    let reason = selectedReason;
    if (selectedReason === 'Lý do khác (Vui lòng ghi chi tiết bên dưới)') {
      if (!customReason.trim()) {
        toast.warning('Vui lòng nhập chi tiết lý do hủy đơn!', { title: 'Thông tin bổ sung' });
        return;
      }
      reason = customReason.trim();
    } else if (!selectedReason) {
      toast.warning('Vui lòng chọn một lý do hủy đơn!', { title: 'Chưa chọn lý do' });
      return;
    }
    
    cancelOrderMutation.mutate({ orderId: orderIdToCancel, cancelReason: reason });
  };

  // Tính toán số liệu thống kê
  const totalOrdersCount = orders.length;
  const activeShippingCount = orders.filter(o => ['CONFIRMED', 'PACKAGING', 'DELIVERING'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'DELIVERED').length;
  const totalSpent = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  // Số lượng đơn hàng tương ứng với từng Tab
  const tabCounts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    PROCESSING: orders.filter(o => ['CONFIRMED', 'PACKAGING'].includes(o.status)).length,
    DELIVERING: orders.filter(o => o.status === 'DELIVERING').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  };

  // Lọc đơn hàng theo Tab và Tìm kiếm
  const filteredOrders = orders.filter(order => {
    // Lọc theo Tab
    let matchesTab = true;
    if (activeTab === 'PENDING') matchesTab = order.status === 'PENDING';
    else if (activeTab === 'PROCESSING') matchesTab = ['CONFIRMED', 'PACKAGING'].includes(order.status);
    else if (activeTab === 'DELIVERING') matchesTab = order.status === 'DELIVERING';
    else if (activeTab === 'DELIVERED') matchesTab = order.status === 'DELIVERED';
    else if (activeTab === 'CANCELLED') matchesTab = order.status === 'CANCELLED';

    // Lọc theo Tìm kiếm
    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const matchesId = order.id.toString().includes(query) || (order.hashId && order.hashId.toLowerCase().includes(query));
      const matchesTitle = order.items.some(item => 
        item.bookTitle.toLowerCase().includes(query)
      );
      matchesSearch = matchesId || matchesTitle;
    }

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 bg-amber-50/50 text-[10px] font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 border border-blue-300 text-blue-700 bg-blue-50/50 text-[10px] font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Đã xác nhận
          </span>
        );
      case 'PACKAGING':
        return (
          <span className="inline-flex items-center gap-1.5 border border-purple-300 text-purple-700 bg-purple-50/50 text-[10px] font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            Đóng gói
          </span>
        );
      case 'DELIVERING':
        return (
          <span className="inline-flex items-center gap-1.5 border border-orange-300 text-orange-700 bg-orange-50/50 text-[10px] font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"></span>
            Đang giao
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 border border-green-300 text-green-700 bg-green-50/50 text-[10px] font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Đã giao
          </span>
        );
      case 'CANCELLED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 border border-red-300 text-red-700 bg-red-50/50 text-[10px] font-bold px-3 py-1 rounded-none uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Đã hủy
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 flex-grow w-full flex items-center justify-center">
        <div className="bg-white border border-divider p-8 md:p-10 text-center shadow-sm w-full relative">
          {/* Decorative background border block */}
          <div className="absolute -inset-2 border border-[#2C4A3B]/5 rounded-none pointer-events-none translate-x-1 translate-y-1"></div>
          
          <div className="w-16 h-16 bg-[#faf8f5] rounded-full flex items-center justify-center mx-auto mb-6 border border-divider text-[#2C4A3B]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-xl font-serif font-bold text-ink uppercase tracking-wide mb-3">Yêu Cầu Đăng Nhập</h2>
          <p className="text-stone-500 text-xs tracking-wider uppercase mb-8 leading-relaxed max-w-xs mx-auto">
            Vui lòng đăng nhập để xem thông tin đơn hàng, lịch sử mua sách và quản lý các giao dịch của bạn.
          </p>

          <button
            onClick={() => navigate('/login', { state: { from: '/orders' } })}
            className="w-full bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-3.5 px-8 rounded-none transition-colors text-xs uppercase tracking-[0.15em] shadow-sm hover:shadow cursor-pointer"
          >
            Đăng nhập ngay
          </button>

          <div className="mt-6 pt-6 border-t border-divider-lt flex justify-between text-[11px] font-sans text-[#2C4A3B]">
            <Link to="/register" className="hover:underline font-bold uppercase tracking-wider">Tạo tài khoản mới</Link>
            <Link to="/" state={{ scrollTo: 'explore' }} className="hover:underline font-bold uppercase tracking-wider text-stone-500">Quay lại cửa hàng</Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 flex-grow w-full">
        <h1 className="text-3xl font-serif font-medium text-ink mb-8">ĐƠN HÀNG CỦA TÔI</h1>
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-20 bg-[#f0ece7] rounded-none"></div>
            <div className="h-20 bg-[#f0ece7] rounded-none"></div>
            <div className="h-20 bg-[#f0ece7] rounded-none"></div>
            <div className="h-20 bg-[#f0ece7] rounded-none"></div>
          </div>
          <div className="h-40 bg-[#f0ece7] rounded-none"></div>
          <div className="h-40 bg-[#f0ece7] rounded-none"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="border border-red-200 p-8 bg-white inline-block rounded-none shadow-sm">
          <p className="text-sm font-medium text-red-700 mb-4">Không thể tải danh sách đơn hàng.</p>
          <button
            onClick={() => refetch()}
            className="bg-ink hover:bg-ink-light text-white px-6 py-2.5 rounded-none transition-colors font-medium text-xs uppercase tracking-wider"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 flex-grow w-full text-ink">
      {/* Header & Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-divider pb-6 mb-10">
        <div>
          <h1 className="text-3xl font-serif font-medium text-ink tracking-wide uppercase">Đơn hàng của tôi</h1>
          <p className="text-ink-light text-xs mt-2 max-w-xl font-sans tracking-wide leading-relaxed">
            Theo dõi tiến độ giao nhận, kiểm tra hóa đơn và lịch sử giao dịch mua sách của bạn tại Pigeon Bookstore.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-0 border border-divider shrink-0 w-full sm:w-auto">
          <Link
            to="/profile"
            className="flex-1 sm:flex-initial px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 bg-white text-ink-light hover:text-ink hover:bg-surface-warm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Hồ sơ cá nhân
          </Link>
          <Link
            to="/orders"
            className="flex-1 sm:flex-initial px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-l border-divider bg-ink text-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Đơn hàng của tôi
          </Link>
        </div>
      </div>

      {orders.length > 0 && (
        /* Thống kê đơn hàng dạng Editorial */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-divider p-5 hover:bg-surface-warm/40 transition-colors shadow-sm">
            <span className="text-[10px] font-sans font-bold tracking-widest text-ink-light uppercase block mb-2">Tổng đơn hàng</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-ink">{totalOrdersCount}</span>
              <span className="text-[10px] uppercase font-bold text-ink-light">đơn</span>
            </div>
          </div>
          <div className="bg-white border border-divider p-5 hover:bg-surface-warm/40 transition-colors shadow-sm">
            <span className="text-[10px] font-sans font-bold tracking-widest text-ink-light uppercase block mb-2">Đang xử lý & giao</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-[#2C4A3B]">{activeShippingCount}</span>
              <span className="text-[10px] uppercase font-bold text-[#2C4A3B]">đơn</span>
            </div>
          </div>
          <div className="bg-white border border-divider p-5 hover:bg-surface-warm/40 transition-colors shadow-sm">
            <span className="text-[10px] font-sans font-bold tracking-widest text-ink-light uppercase block mb-2">Đã hoàn thành</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-green-700">{completedCount}</span>
              <span className="text-[10px] uppercase font-bold text-green-700">đơn</span>
            </div>
          </div>
          <div className="bg-white border border-divider p-5 hover:bg-surface-warm/40 transition-colors shadow-sm">
            <span className="text-[10px] font-sans font-bold tracking-widest text-ink-light uppercase block mb-2">Tổng chi tiêu</span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold text-ink">{totalSpent.toLocaleString('vi-VN')}</span>
              <span className="text-[10px] uppercase font-bold text-ink-light">đ</span>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        /* Trạng thái chưa có đơn hàng nào */
        <div className="bg-white border border-divider rounded-none p-16 text-center shadow-sm max-w-xl mx-auto my-6">
          <div className="w-16 h-16 bg-[#faf8f5] rounded-full flex items-center justify-center mx-auto mb-6 border border-divider text-ink-light">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-serif font-bold text-ink uppercase tracking-wide mb-3">BẠN CHƯA CÓ ĐƠN HÀNG NÀO</h2>
          <p className="text-ink-light text-xs tracking-wider uppercase mb-8 leading-relaxed max-w-sm mx-auto">
            Hãy mua sắm và chốt đơn để lưu lại lịch sử giao dịch tại đây nhé!
          </p>
          <Link
            to="/"
            className="inline-block bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-3.5 px-8 rounded-none transition-colors text-xs uppercase tracking-[0.15em] shadow-sm hover:shadow"
          >
            Khám phá Cửa hàng
          </Link>
        </div>
      ) : (
        <>
          {/* Bộ lọc trạng thái & Thanh tìm kiếm */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6 border-b border-divider pb-4">
            {/* Tabs Trạng thái */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
              {[
                { 
                  key: 'ALL', 
                  label: 'Tất cả',
                  icon: (
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ),
                  activeClass: 'border-ink text-ink bg-surface-subtle',
                  badgeClass: 'bg-ink text-white'
                },
                { 
                  key: 'PENDING', 
                  label: 'Chờ xác nhận',
                  icon: (
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  activeClass: 'border-amber-500 text-amber-800 bg-amber-50/70',
                  badgeClass: 'bg-amber-600 text-white'
                },
                { 
                  key: 'PROCESSING', 
                  label: 'Đang xử lý',
                  icon: (
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  ),
                  activeClass: 'border-indigo-500 text-indigo-800 bg-indigo-50/70',
                  badgeClass: 'bg-indigo-600 text-white'
                },
                { 
                  key: 'DELIVERING', 
                  label: 'Đang giao',
                  icon: (
                    <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h2m0 0l3.382-3.382a1 1 0 01.707-.293H21M13 8h7v5M13 12h7" />
                    </svg>
                  ),
                  activeClass: 'border-orange-500 text-orange-800 bg-orange-50/70',
                  badgeClass: 'bg-orange-600 text-white'
                },
                { 
                  key: 'DELIVERED', 
                  label: 'Đã giao',
                  icon: (
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  activeClass: 'border-green-600 text-green-800 bg-green-50/70',
                  badgeClass: 'bg-green-700 text-white'
                },
                { 
                  key: 'CANCELLED', 
                  label: 'Đã hủy',
                  icon: (
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  activeClass: 'border-red-500 text-red-800 bg-red-50/70',
                  badgeClass: 'bg-red-600 text-white'
                }
              ].map(tab => {
                const isActive = activeTab === tab.key;
                const count = tabCounts[tab.key];
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`group px-3.5 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap border transition-all duration-200 flex items-center gap-2 cursor-pointer rounded-none ${
                      isActive
                        ? tab.activeClass
                        : 'border-divider/60 text-ink-light bg-white hover:text-ink hover:bg-surface-warm hover:border-divider'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className={`text-[9px] font-sans font-semibold px-2 py-0.5 rounded-full transition-colors duration-200 ${
                        isActive ? tab.badgeClass : 'bg-surface-subtle text-ink-light border border-divider/40'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Ô tìm kiếm đơn hàng */}
            <div className="relative w-full lg:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-light">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm mã đơn hoặc tên sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-divider bg-transparent focus:border-ink outline-none text-xs tracking-wider transition-colors placeholder:text-ink-light/50 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-ink-light hover:text-ink"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Danh sách đơn hàng đã lọc */}
          {filteredOrders.length === 0 ? (
            /* Không tìm thấy đơn hàng */
            <div className="bg-white border border-divider rounded-none p-12 text-center shadow-sm max-w-xl mx-auto my-6">
              <div className="w-12 h-12 bg-[#faf8f5] rounded-full flex items-center justify-center mx-auto mb-4 border border-divider text-ink-light">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-2">Không tìm thấy đơn hàng</h3>
              <p className="text-ink-light text-xs mb-6 max-w-xs mx-auto">
                Không tìm thấy đơn hàng nào khớp với trạng thái đã chọn hoặc từ khóa tìm kiếm "{searchQuery}".
              </p>
              <button
                onClick={() => { setActiveTab('ALL'); setSearchQuery(''); }}
                className="border border-divider hover:bg-surface-warm text-ink font-bold py-2 px-5 text-xs transition-colors uppercase tracking-wider"
              >
                Xóa bộ lọc & tìm kiếm
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const orderDate = new Date(order.created_at).toLocaleDateString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-divider rounded-none shadow-sm overflow-hidden hover:border-divider-lt hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    {/* Header đơn hàng */}
                    <div className="p-5 border-b border-divider bg-[#faf8f5]/80 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-surface-subtle p-2 text-ink-light border border-divider/40">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-serif font-bold text-ink text-base">Mã đơn: #{order.hashId || order.id}</span>
                          <div className="flex items-center gap-1.5 text-ink-light text-xs mt-0.5 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{orderDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Danh sách sản phẩm trong đơn */}
                    <div className="p-5 divide-y divide-divider bg-white">
                      {order.items.map((item, idx) => {
                        const bookCover = item.cover_url 
                          ? getImageUrl(item.cover_url) 
                          : `https://picsum.photos/seed/${item.bookId + 10}/150/200`;
                        return (
                          <div key={idx} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center gap-4 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-4 flex-grow">
                              {/* Bìa sách thu nhỏ */}
                              <div className="w-12 h-16 bg-surface-subtle flex-shrink-0 border border-divider-lt overflow-hidden relative shadow-sm">
                                <img
                                  src={bookCover}
                                  alt={item.bookTitle}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              
                              {/* Thông tin chi tiết */}
                              <div className="flex-grow">
                                <h4 className="font-serif font-bold text-ink line-clamp-1 text-sm md:text-base leading-snug">{item.bookTitle}</h4>
                                <p className="text-ink-light text-xs mt-1 font-sans">
                                  Số lượng: <span className="font-semibold text-ink">{item.quantity}</span> × {Number(item.price).toLocaleString('vi-VN')} đ
                                </p>
                              </div>
                            </div>

                            {/* Nút Hỏi đáp AI nếu đã giao */}
                            {order.status === 'DELIVERED' && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedReviewBook({
                                    id: item.bookId,
                                    hashId: item.hashId,
                                    title: item.bookTitle
                                  })}
                                  className="text-ink hover:text-[#2C4A3B] text-[10px] font-bold flex items-center gap-1.5 border border-divider hover:border-ink rounded-none px-4 py-2 bg-transparent hover:bg-[#faf8f5] transition-all uppercase tracking-wider whitespace-nowrap shadow-sm hover:shadow active:translate-y-px cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.252.586 1.813l-3.974 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.89a1 1 0 00-1.176 0l-3.976 2.89c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.976-2.89c-.775-.561-.377-1.813.586-1.813h4.906a1 1 0 00.95-.69l1.519-4.674z" />
                                  </svg>
                                  Đánh giá
                                </button>
                                <Link
                                  to={`/books/${item.hashId || item.bookId}/chat`}
                                  className="text-[#2C4A3B] hover:text-[#1e3529] text-[10px] font-bold flex items-center gap-1.5 border border-[#2C4A3B]/30 hover:border-[#2C4A3B] rounded-none px-4 py-2 bg-transparent hover:bg-[#faf8f5] transition-all uppercase tracking-wider whitespace-nowrap shadow-sm hover:shadow active:translate-y-px"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  Hỏi đáp AI
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Hộp lý do hủy đơn hàng (nếu có) */}
                    {order.status === 'CANCELLED' && order.cancel_reason && (
                      <div className="mx-5 my-3 bg-red-50 border border-red-100 p-3.5 text-xs text-stone-700 flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <span className="font-bold block uppercase tracking-wide text-[10px] text-red-700 font-sans">Đơn hàng đã bị hủy</span>
                          <p className="mt-0.5 font-medium leading-relaxed font-sans">Lý do: <span className="italic font-bold text-stone-900">"{order.cancel_reason}"</span></p>
                        </div>
                      </div>
                    )}

                    {/* Footer đơn hàng: Tổng tiền & Nút bấm */}
                    <div className="p-5 border-t border-divider bg-[#faf8f5]/40 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-ink-light text-xs uppercase tracking-wider font-bold">Tổng số tiền:</span>
                        <span className="text-[#2C4A3B] font-serif font-bold text-xl">
                          {Number(order.total_amount).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {['PENDING', 'CONFIRMED', 'PACKAGING'].includes(order.status) && (
                          <button
                            onClick={() => {
                              setOrderIdToCancel(order.hashId || order.id);
                              setSelectedReason(CANCEL_REASONS[0]);
                              setCustomReason('');
                              setIsCancelModalOpen(true);
                            }}
                            disabled={cancelOrderMutation.isPending}
                            className="border border-red-200 hover:bg-red-50 text-red-600 font-bold py-2 px-5 rounded-none text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                          >
                            Hủy đơn
                          </button>
                        )}
                        <Link
                          to={`/orders/${order.hashId || order.id}`}
                          className="border border-divider bg-white hover:bg-surface-warm text-ink font-bold py-2 px-5 rounded-none text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi tiết
                        </Link>
                        {order.status === 'DELIVERED' && (
                          <button
                            onClick={() => handleReorder(order.items)}
                            disabled={reorderMutation.isPending}
                            className="border border-[#2C4A3B] text-[#2C4A3B] hover:bg-[#2C4A3B] hover:text-white bg-white font-bold py-2 px-5 rounded-none text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider flex items-center gap-1.5 active:translate-y-px disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
                            </svg>
                            Mua lại
                          </button>
                        )}
                        {order.status === 'PENDING' && order.payment_method !== 'COD' && (
                          <button
                            onClick={() => handlePayNow(order.hashId || order.id)}
                            disabled={payMutation.isPending}
                            className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-2 px-5 rounded-none text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider flex items-center gap-1.5 active:translate-y-px"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Thanh toán ngay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Chọn lý do hủy đơn hàng */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-divider max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 rounded-none font-sans relative">
            
            {/* Nút đóng góc phải */}
            <button 
              onClick={() => {
                setIsCancelModalOpen(false);
                setOrderIdToCancel(null);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors border-none bg-transparent cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h3 className="font-serif font-bold text-xl text-stone-950 uppercase tracking-wide">Hủy đơn hàng #{orderIdToCancel}</h3>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này. Ý kiến của bạn giúp chúng tôi cải thiện dịch vụ tốt hơn.
              </p>
            </div>

            {/* Danh sách lý do hủy đơn */}
            <div className="space-y-3 py-1 max-h-[250px] overflow-y-auto pr-1">
              {CANCEL_REASONS.map((reason, idx) => (
                <label 
                  key={idx}
                  className={`flex items-start gap-3 p-3 border transition-all cursor-pointer ${
                    selectedReason === reason 
                      ? 'border-[#2C4A3B] bg-[#faf8f5]'
                      : 'border-stone-200 hover:border-stone-400 bg-white'
                  }`}
                >
                  <input 
                    type="radio"
                    name="cancel_reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-[#2C4A3B] focus:ring-[#2C4A3B] border-stone-300"
                  />
                  <span className="text-xs font-semibold text-stone-800">{reason}</span>
                </label>
              ))}
            </div>

            {/* Ô nhập lý do tùy chỉnh (nếu chọn lý do khác) */}
            {selectedReason === 'Lý do khác (Vui lòng ghi chi tiết bên dưới)' && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">Chi tiết lý do khác:</label>
                <textarea 
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết của bạn tại đây..."
                  rows={3}
                  className="w-full p-3 border border-stone-200 focus:border-[#2C4A3B] outline-none text-xs leading-relaxed resize-none bg-white text-stone-800"
                  maxLength={250}
                />
                <span className="text-[10px] text-stone-400 block text-right">{customReason.length}/250 ký tự</span>
              </div>
            )}

            {/* Khung nút điều khiển */}
            <div className="flex gap-3 border-t border-divider pt-4">
              <button
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setOrderIdToCancel(null);
                }}
                className="flex-1 py-3 border border-divider hover:bg-stone-50 text-stone-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelOrderMutation.isPending}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 border-none cursor-pointer disabled:opacity-50"
              >
                {cancelOrderMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận hủy đơn'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quick Review Modal integration */}
      {selectedReviewBook && (
        <OrderReviewModal
          book={selectedReviewBook}
          onClose={() => setSelectedReviewBook(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-component: Hộp thoại đánh giá nhanh từ lịch sử đơn hàng ──────────────
function OrderReviewModal({ book, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const reviewMutation = useMutation({
    mutationFn: (payload) => api.post(`/books/${book.hashId || book.id}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['myOrders']);
      queryClient.invalidateQueries(['bookReviews', book.hashId || String(book.id)]);
      toast.success(`Đã đăng đánh giá cho sách "${book.title}" thành công!`, { title: 'Thành công' });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi đăng đánh giá' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn đánh giá từ 1 đến 5 sao!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (!comment || comment.trim().length < 10) {
      toast.error('Nội dung nhận xét phải có ít nhất 10 ký tự!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (comment.trim().length > 1000) {
      toast.error('Nội dung bình luận quá dài! Tối đa 1000 ký tự.', { title: 'Lỗi nhập liệu' });
      return;
    }
    reviewMutation.mutate({ rating, comment: comment.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-divider w-full max-w-md shadow-2xl flex flex-col rounded-none animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider bg-[#faf8f5]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#2C4A3B] font-semibold mb-0.5">Đánh giá tác phẩm</p>
            <h4 className="text-sm font-serif font-semibold text-ink leading-tight">
              {book.title}
            </h4>
          </div>
          <button onClick={onClose} className="text-ink-light hover:text-ink transition-colors p-1 cursor-pointer bg-transparent border-0">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Star selector */}
          <div className="text-center space-y-2">
            <span className="block text-xs uppercase tracking-wider text-ink-light font-bold">
              Chọn mức độ hài lòng *
            </span>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = hoverRating ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform duration-100 hover:scale-125 bg-transparent border-0"
                  >
                    <svg
                      className={`w-8 h-8 ${isLit ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#2C4A3B] font-semibold tracking-wider uppercase pt-1">
              {
                {
                  1: 'Rất tệ',
                  2: 'Tệ',
                  3: 'Bình thường',
                  4: 'Tốt',
                  5: 'Tuyệt vời'
                }[rating]
              }
            </p>
          </div>

          {/* Comment text area */}
          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-ink-light font-bold">
              Nội dung nhận xét *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nghĩ của bạn về nội dung sách, chất lượng in ấn hoặc cảm xúc sau khi đọc xong..."
              rows="4"
              className="w-full border border-divider rounded-none px-3.5 py-2.5 text-xs text-ink focus:border-ink focus:outline-none bg-transparent placeholder:text-stone-400 font-sans"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-divider/50">
            <button
              type="button"
              onClick={onClose}
              className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-2 px-4 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer bg-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-2 px-5 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

