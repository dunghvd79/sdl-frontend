import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../services/image';
import ConfirmDialog from '../components/ConfirmDialog';

const CANCEL_REASONS = [
  'Tôi muốn thay đổi địa chỉ nhận hàng hoặc số điện thoại',
  'Tôi muốn đổi phương thức thanh toán hoặc áp dụng mã giảm giá khác',
  'Tôi đặt trùng đơn hoặc không còn nhu cầu mua nữa',
  'Tìm thấy mức giá rẻ hơn ở nơi khác',
  'Thời gian giao nhận dự kiến quá lâu',
  'Lý do khác (Vui lòng ghi chi tiết bên dưới)'
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { fetchCartCount } = useCart();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedReviewBook, setSelectedReviewBook] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false });

  // 1. Fetch chi tiết đơn hàng
  const { data: orderResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['orderDetail', id],
    queryFn: async () => {
      const response = await api.get(`/orders/${id}`);
      return response.data.data;
    }
  });

  const order = orderResponse || null;

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

  const changeToCodMutation = useMutation({
    mutationFn: async (orderId) => {
      return api.put(`/orders/${orderId}/change-to-cod`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orderDetail', id]);
      queryClient.invalidateQueries(['myOrders']);
      toast.success('Đã chuyển sang phương thức thanh toán COD thành công!', { title: 'Đã cập nhật' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi chuyển phương thức' });
    }
  });

  const handleChangeToCod = (orderId) => {
    setDialog({
      isOpen: true,
      title: 'Chuyển sang thanh toán COD',
      message: 'Bạn có chắc chắn muốn chuyển sang hình thức nhận hàng thanh toán tiền mặt (COD) cho đơn hàng này? Sách trong giỏ hàng tương ứng sẽ được dọn sạch.',
      confirmText: 'Xác nhận chuyển',
      cancelText: 'Hủy',
      variant: 'info',
      onConfirm: () => changeToCodMutation.mutate(orderId)
    });
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
    mutationFn: async (cancelReason) => {
      const response = await api.put(`/orders/${id}/cancel`, { cancelReason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orderDetail', id]);
      queryClient.invalidateQueries(['myOrders']);
      toast.success('Hủy đơn hàng thành công!', { title: 'Đã hủy đơn hàng' });
      setIsCancelModalOpen(false);
      setSelectedReason('');
      setCustomReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi hủy đơn hàng' });
    }
  });

  const handleConfirmCancel = () => {
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
    
    cancelOrderMutation.mutate(reason);
  };

  // Xác định vị trí trạng thái trong Timeline
  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PACKAGING': return 2;
      case 'DELIVERING': return 3;
      case 'DELIVERED': return 4;
      default: return -1;
    }
  };

  const steps = [
    { label: 'Chờ xác nhận', desc: 'Đơn chờ hệ thống xử lý' },
    { label: 'Đã xác nhận', desc: 'Đã thanh toán / Đã duyệt' },
    { label: 'Đóng gói', desc: 'Đang soạn và đóng gói sách' },
    { label: 'Đang giao', desc: 'Đang vận chuyển đến bạn' },
    { label: 'Đã giao', desc: 'Giao hàng thành công' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="border border-amber-300 text-amber-700 bg-amber-50/50 text-[10px] font-semibold px-3 py-1 rounded-none uppercase tracking-wider">
            Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="border border-blue-200 text-blue-700 bg-blue-50/50 text-[10px] font-semibold px-3 py-1 rounded-none uppercase tracking-wider">
            Đã xác nhận
          </span>
        );
      case 'PACKAGING':
        return (
          <span className="border border-indigo-200 text-indigo-700 bg-indigo-50/50 text-[10px] font-semibold px-3 py-1 rounded-none uppercase tracking-wider">
            Đóng gói
          </span>
        );
      case 'DELIVERING':
        return (
          <span className="border border-orange-200 text-orange-700 bg-orange-50/50 text-[10px] font-semibold px-3 py-1 rounded-none uppercase tracking-wider">
            Đang giao
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="border border-green-200 text-green-700 bg-green-50/50 text-[10px] font-semibold px-3 py-1 rounded-none uppercase tracking-wider">
            Đã giao
          </span>
        );
      case 'CANCELLED':
      default:
        return (
          <span className="border border-red-200 text-red-700 bg-red-50/50 text-[10px] font-semibold px-3 py-1 rounded-none uppercase tracking-wider">
            Đã hủy
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 flex-grow w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-[#f0ece7]"></div>
          <div className="h-10 w-64 bg-[#f0ece7]"></div>
          <div className="h-40 bg-[#f0ece7]"></div>
          <div className="h-60 bg-[#f0ece7]"></div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="border border-red-200 p-8 bg-white inline-block rounded-none">
          <p className="text-sm font-medium text-red-700 mb-4">Không thể tải thông tin đơn hàng này.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => refetch()}
              className="bg-ink hover:bg-ink-light text-white px-6 py-2.5 rounded-none transition-colors font-medium text-xs uppercase tracking-wider"
            >
              Thử lại
            </button>
            <Link
              to="/orders"
              className="border border-divider hover:bg-surface-warm text-ink px-6 py-2.5 rounded-none transition-colors font-medium text-xs uppercase tracking-wider"
            >
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const orderDate = new Date(order.created_at).toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full text-ink">
      {/* Breadcrumbs & Header */}
      <div className="mb-8">
        <Link
          to="/orders"
          className="inline-flex items-center text-xs uppercase tracking-wider text-ink-light hover:text-ink transition-colors font-semibold gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Quay lại Lịch sử đơn hàng
        </Link>
        <div className="flex flex-wrap justify-between items-center gap-4 mt-4 border-b border-divider pb-6">
          <div>
            <h1 className="text-3xl font-serif font-medium text-ink">ĐƠN HÀNG #{order.hashId || order.id}</h1>
            <p className="text-ink-light text-xs mt-1.5">Đặt ngày: {orderDate}</p>
          </div>
          <div className="flex items-center gap-4">
            {order.status === 'DELIVERED' && (
              <button
                onClick={() => handleReorder(order.items)}
                disabled={reorderMutation.isPending}
                className="border border-[#2C4A3B] text-[#2C4A3B] hover:bg-[#2C4A3B] hover:text-white bg-white font-bold py-2 px-6 rounded-none text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider flex items-center gap-1.5 active:translate-y-px disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
                </svg>
                Mua lại
              </button>
            )}
            {['PENDING', 'CONFIRMED', 'PACKAGING'].includes(order.status) && (
              <button
                onClick={() => {
                  setSelectedReason(CANCEL_REASONS[0]);
                  setCustomReason('');
                  setIsCancelModalOpen(true);
                }}
                disabled={cancelOrderMutation.isPending}
                className="border border-red-200 hover:bg-red-50 text-red-600 font-bold py-2 px-5 rounded-none text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider flex items-center gap-1.5 active:translate-y-px disabled:opacity-50"
              >
                Hủy đơn
              </button>
            )}
            {order.status === 'PENDING' && order.payment_method !== 'COD' && (
              <>
                <button
                  onClick={() => handlePayNow(order.hashId || order.id)}
                  disabled={payMutation.isPending || changeToCodMutation.isPending}
                  className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-2 px-6 rounded-none text-xs transition-colors shadow-none uppercase tracking-wider"
                >
                  Thanh toán ngay
                </button>
                <button
                  onClick={() => handleChangeToCod(order.hashId || order.id)}
                  disabled={payMutation.isPending || changeToCodMutation.isPending}
                  className="border border-[#2C4A3B] text-[#2C4A3B] hover:bg-[#2C4A3B] hover:text-white bg-white font-bold py-2 px-6 rounded-none text-xs transition-all shadow-sm hover:shadow uppercase tracking-wider flex items-center gap-1.5 active:translate-y-px"
                >
                  Thanh toán COD
                </button>
              </>
            )}
            {getStatusBadge(order.status)}
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="bg-white border border-divider rounded-none p-8 mb-8 shadow-none">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-ink-light mb-8">Trạng thái vận chuyển</h3>
        
        {order.status === 'CANCELLED' ? (
          <div className="border border-red-200 bg-red-50/30 p-5 rounded-none flex items-start gap-4">
            <div className="bg-red-100 text-red-700 p-2 rounded-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-serif font-semibold text-red-800 text-sm">ĐƠN HÀNG ĐÃ BỊ HỦY</h4>
              <p className="text-red-700/80 text-xs mt-1">Đơn hàng này không được tiếp tục xử lý. Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ khách hàng của thư viện.</p>
              {order.cancel_reason && (
                <div className="mt-3 bg-white border border-red-200/60 p-3.5 text-xs text-stone-700 rounded-none max-w-xl">
                  <span className="font-bold text-red-700 uppercase tracking-wider text-[10px] block mb-0.5">Lý do hủy đơn:</span>
                  <span className="font-semibold italic text-stone-900">"{order.cancel_reason}"</span>
                </div>
              )}
              {order.payment_status === 'REFUND_PENDING' && (
                <div className="mt-3 border border-amber-300 bg-amber-50/50 p-3 text-xs text-amber-800 rounded-none max-w-xl flex items-start gap-2">
                  <span className="text-sm">ℹ️</span>
                  <p className="leading-relaxed">
                    Yêu cầu hoàn tiền của bạn đang được hệ thống xử lý đối soát. Tiền sẽ được hoàn về trong vòng 2-3 ngày làm việc.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Line connector for large screens */}
            <div className="absolute top-5 left-1/10 right-1/10 h-0.5 bg-divider hidden md:block z-0" />
            
            {/* Steps Container */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4 relative z-10">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;
                const isFuture = idx > currentStep;

                return (
                  <div key={idx} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-2">
                    {/* Circle Indicator */}
                    <div
                      className={`w-10 h-10 flex items-center justify-center border font-mono text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-[#2C4A3B] border-[#2C4A3B] text-white'
                          : isActive
                          ? 'bg-white border-[#2C4A3B] text-[#2C4A3B] ring-4 ring-[#2C4A3B]/10 animate-pulse'
                          : 'bg-white border-divider text-ink-light'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Step Text Info */}
                    <div className="flex-grow">
                      <h4
                        className={`text-xs uppercase tracking-wider font-semibold ${
                          isActive
                            ? 'text-[#2C4A3B]'
                            : isCompleted
                            ? 'text-ink font-medium'
                            : 'text-ink-light'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[11px] text-ink-light mt-0.5 md:max-w-[140px] md:mx-auto">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Info Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left side: Items bought */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white border border-divider rounded-none p-6 shadow-none flex-grow">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-ink-light mb-6 border-b border-divider pb-3">Chi tiết sản phẩm</h3>
            <div className="divide-y divide-divider">
              {order.items.map((item, idx) => {
                const title = item.bookTitle || 'Cuốn sách chưa rõ tên';
                const author = item.bookAuthor || 'Khuyết danh';
                const price = Number(item.price);
                const subtotal = price * item.quantity;
                const coverUrl = item.cover_url 
                  ? getImageUrl(item.cover_url) 
                  : `https://picsum.photos/seed/${item.bookId}/800/1000`;

                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                    {/* Book Cover Thumbnail */}
                    <div className="w-14 sm:w-16 aspect-[3/4] border border-divider bg-surface-warm flex-shrink-0 overflow-hidden shadow-none">
                      <img 
                        src={coverUrl} 
                        alt={title} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => { e.target.src = `https://picsum.photos/seed/${item.bookId}/800/1000`; }}
                      />
                    </div>

                    {/* Text info and actions */}
                    <div className="flex-grow flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="space-y-1 flex-grow">
                        <h4 className="font-serif font-semibold text-ink text-base leading-tight hover:text-[#2C4A3B] transition-colors line-clamp-2">
                          <Link to={`/books/${item.hashId || item.bookId}`}>{title}</Link>
                        </h4>
                        <p className="text-ink-light text-xs">Tác giả: <span className="text-ink font-medium">{author}</span></p>
                        <p className="text-ink-light text-xs font-mono">
                          {item.quantity} x {price.toLocaleString('vi-VN')} đ
                        </p>
                      </div>

                      <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-dashed border-divider-lt sm:border-t-0 flex-shrink-0">
                        <span className="font-semibold font-mono text-sm text-[#2C4A3B]">{subtotal.toLocaleString('vi-VN')} đ</span>
                        {order.status === 'DELIVERED' ? (
                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReviewBook({
                                id: item.bookId,
                                hashId: item.hashId,
                                title: item.bookTitle || title
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
                              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white text-[10px] font-semibold py-1.5 px-4 rounded-none transition-colors uppercase tracking-wider inline-flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Hỏi đáp AI
                            </Link>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] text-ink-light uppercase tracking-wider font-semibold border border-divider px-2.5 py-1 bg-surface-warm/50 cursor-not-allowed">
                            <svg className="w-3.5 h-3.5 text-ink-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            AI Chat (Khi đã giao)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle side: Payment summary & general info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Thông tin khách hàng */}
          <div className="bg-white border border-divider rounded-none p-6 shadow-none">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-ink-light mb-4 border-b border-divider pb-3">Thông tin khách hàng</h3>
            <div className="space-y-3.5 text-xs font-sans">
              <div>
                <span className="text-ink-light uppercase tracking-wider block mb-1">Người nhận:</span>
                <span className="font-semibold text-ink text-sm block">{order.shipping_name || order.full_name || 'Người dùng thư viện'}</span>
              </div>
              <div>
                <span className="text-ink-light uppercase tracking-wider block mb-1">Số điện thoại:</span>
                <span className="font-medium text-ink block">{order.shipping_phone || 'Chưa cung cấp'}</span>
              </div>
              <div>
                <span className="text-ink-light uppercase tracking-wider block mb-1">Địa chỉ giao hàng:</span>
                <span className="font-medium text-ink block leading-relaxed">{order.shipping_address || 'Chưa cung cấp'}</span>
              </div>
              <div className="border-t border-divider pt-3.5">
                <span className="text-ink-light uppercase tracking-wider block mb-1">Tài khoản (Email):</span>
                <span className="font-mono text-ink-light block break-all">{order.email}</span>
              </div>
            </div>
          </div>

          {/* Thông tin đơn hàng */}
          <div className="bg-white border border-divider rounded-none p-6 shadow-none">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-ink-light mb-4 border-b border-divider pb-3">Thông tin đơn hàng</h3>
            <div className="space-y-3.5 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-ink-light uppercase tracking-wider">Ngày đặt:</span>
                <span className="font-medium text-ink">{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-light uppercase tracking-wider">Trạng thái:</span>
                <span>{getStatusBadge(order.status)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-light uppercase tracking-wider">Phương thức:</span>
                <span className="font-medium text-ink">
                  {order.payment_method === 'COD' ? 'Tiền mặt (COD)' : 'PayOS (VietQR) trực tuyến'}
                </span>
              </div>
              {order.shipping_notes && (
                <div className="border-t border-divider pt-3.5">
                  <span className="text-ink-light uppercase tracking-wider block mb-1">Ghi chú:</span>
                  <span className="text-ink italic leading-relaxed block bg-surface-warm/40 p-2.5 border border-divider/60">{order.shipping_notes}</span>
                </div>
              )}
              
              <div className="border-t border-divider pt-3.5 space-y-2">
                {Number(order.discount_amount || 0) > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-ink-light uppercase tracking-wider">Tiền gốc:</span>
                      <span className="font-medium text-ink">
                        {(Number(order.total_amount) + Number(order.discount_amount || 0)).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    {order.coupon_code && (
                      <div className="flex justify-between items-center">
                        <span className="text-ink-light uppercase tracking-wider">Mã giảm giá:</span>
                        <span className="font-semibold text-[#2C4A3B] uppercase bg-[#fdfaf7] px-1.5 py-0.5 border border-[#2C4A3B]/20">
                          {order.coupon_code}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[#2C4A3B]">
                      <span className="uppercase tracking-wider">Giảm giá:</span>
                      <span className="font-medium">
                        -{Number(order.discount_amount).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between items-center pt-2 border-t border-divider/50">
                  <span className="text-ink-light uppercase tracking-wider font-semibold">Tổng thanh toán:</span>
                  <span className="font-serif font-bold text-[#2C4A3B] text-lg">
                    {Number(order.total_amount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Help box */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="bg-[#faf8f5] border border-divider rounded-none p-6 shadow-none flex-grow flex flex-col justify-between">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-ink mb-4 border-b border-divider pb-3">Trợ giúp mua hàng</h3>
              <div className="space-y-4">
                <p className="text-xs text-ink-light leading-relaxed">
                  Bạn có thể tự do đọc sách & tham gia hỏi đáp AI đối với cuốn sách đã mua ngay khi trạng thái đơn chuyển sang <strong>Đã giao thành công (DELIVERED)</strong>.
                </p>
                <p className="text-xs text-ink-light leading-relaxed">
                  Nếu gặp khó khăn trong quá trình thanh toán hoặc giao nhận hàng, vui lòng nhắn tin trực tiếp tới Fanpage hoặc Hotline của thư viện để được hỗ trợ 24/7.
                </p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-divider/50 mt-6 text-center">
              <span className="font-serif italic text-ink-light text-xs">Smart Digital Library</span>
              <div className="text-[10px] uppercase tracking-widest text-ink-light/60 mt-1">Est. 2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chọn lý do hủy đơn hàng */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-divider max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 rounded-none font-sans relative">
            
            {/* Nút đóng góc phải */}
            <button 
              onClick={() => {
                setIsCancelModalOpen(false);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors border-none bg-transparent cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h3 className="font-serif font-bold text-xl text-stone-950 uppercase tracking-wide">Hủy đơn hàng #{order.hashId || order.id}</h3>
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
          orderId={id}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        {...dialog}
        onCancel={() => setDialog({ isOpen: false })}
      />
    </div>
  );
}

// ─── Sub-component: Hộp thoại đánh giá nhanh từ chi tiết đơn hàng ─────────────
function OrderReviewModal({ book, onClose, orderId }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const reviewMutation = useMutation({
    mutationFn: (payload) => api.post(`/books/${book.hashId || book.id}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['orderDetail', orderId]);
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
