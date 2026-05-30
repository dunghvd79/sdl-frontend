import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, 
  Gift, 
  Tag, 
  Calendar, 
  Copy, 
  Check, 
  ShoppingBag, 
  Info, 
  ChevronRight, 
  Lock,
  Sparkles
} from 'lucide-react';

export default function PromotionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [copiedId, setCopiedId] = useState(null);

  // Lấy danh sách coupon đang hoạt động
  const { data: coupons, isLoading, isError, refetch } = useQuery({
    queryKey: ['activeCoupons', user?.id],
    queryFn: async () => {
      const response = await api.get('/coupons/active');
      return response.data.data;
    },
    refetchOnWindowFocus: false,
  });

  const handleCopyCode = (id, code, isUsed) => {
    if (isUsed) return;
    
    // Sao chép vào clipboard
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    
    if (user) {
      toast.success(`Đã sao chép mã "${code}" thành công!`, { title: 'Sao chép mã giảm giá' });
    } else {
      toast.info(`Đã sao chép mã "${code}". Vui lòng đăng nhập để sử dụng mã này!`, { title: 'Thông tin' });
    }

    // Tự động chuyển đổi lại trạng thái copy sau 2 giây
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleUseNow = (code) => {
    if (code) {
      localStorage.setItem('active_coupon_code', code);
      navigator.clipboard.writeText(code);
      toast.success(`Đã kích hoạt mã "${code}" thành công! Ưu đãi sẽ tự động áp dụng khi thanh toán.`, { title: 'Kích hoạt mã giảm giá' });
    }
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (amount) => {
    return Number(amount).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex-grow py-12 px-6 font-sans text-stone-800">
      <div className="max-w-7xl mx-auto">
        {/* Quay lại trang chủ */}
        <button
          onClick={() => navigate('/')}
          className="group mb-8 flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 uppercase tracking-widest font-bold transition-colors border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại Cửa hàng
        </button>

        {/* Tiêu đề chính */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-[#2C4A3B] text-[10px] font-bold tracking-[0.3em] uppercase block">
            Ưu đãi đặc biệt
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 uppercase tracking-wide">
            Trạm Khuyến Mãi
          </h1>
          <div className="h-0.5 w-16 bg-[#2C4A3B] mx-auto mt-4"></div>
          <p className="text-stone-500 italic text-sm">
            Nơi lưu giữ các mã giảm giá và voucher đặc quyền dành riêng cho khách hàng của Pigeon Bookstore. Nhận ngay ưu đãi khi mua sách của bạn.
          </p>
        </div>

        {/* Chưa đăng nhập Alert banner */}
        {!user && (
          <div className="max-w-3xl mx-auto mb-12 border border-[#d4d2cb] bg-[#e8e4db]/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
                <Lock size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm uppercase text-stone-800 tracking-wider">Đăng nhập tài khoản của bạn</h4>
                <p className="text-xs text-stone-500">Đăng nhập ngay để lưu mã ưu đãi và tự động kiểm tra lịch sử sử dụng voucher.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white px-6 py-2.5 uppercase font-bold tracking-wider text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {/* Trạng thái Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-stone-200 h-40 animate-pulse flex">
                <div className="w-1/3 bg-stone-200 border-r border-stone-100"></div>
                <div className="w-2/3 p-4 space-y-4">
                  <div className="h-6 bg-stone-200 rounded w-3/4"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                  <div className="h-8 bg-stone-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trạng thái lỗi */}
        {isError && (
          <div className="border border-red-200 bg-red-50 text-red-700 p-8 max-w-xl mx-auto text-center space-y-4">
            <h2 className="text-lg font-serif font-bold uppercase tracking-wider">Không thể tải danh sách ưu đãi</h2>
            <p className="text-sm text-stone-600">Máy chủ hiện không phản hồi. Vui lòng tải lại trang hoặc thử lại sau ít phút.</p>
            <button
              onClick={() => refetch()}
              className="bg-[#2C4A3B] text-white px-6 py-2 uppercase font-bold tracking-widest text-xs hover:bg-[#1e3529]"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Danh sách Voucher */}
        {!isLoading && !isError && (
          <>
            {coupons?.length === 0 ? (
              <div className="border border-stone-200 bg-white p-16 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-full border border-stone-100 flex items-center justify-center bg-stone-50 text-stone-400">
                  <Gift size={28} className="animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-stone-800">
                    Chưa có mã ưu đãi nào
                  </h3>
                  <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed">
                    Hiện tại chưa có chương trình ưu đãi nào phát hành mã giảm giá hoạt động. Chúng tôi sẽ cập nhật các mã giảm giá đặc quyền sớm nhất.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {coupons?.map((coupon) => {
                  const isPercent = coupon.discount_type === 'PERCENT';
                  const isUsed = coupon.is_used === true;
                  const isCopied = copiedId === coupon.id;
                  
                  // Tính phần trăm sử dụng (nếu có giới hạn)
                  const usagePercentage = coupon.usage_limit > 0 
                    ? Math.round((coupon.used_count / coupon.usage_limit) * 100)
                    : 0;
                  const isAlmostOut = usagePercentage >= 80;

                  return (
                    <div 
                      key={coupon.id} 
                      className={`relative bg-white border border-stone-200 flex h-44 shadow-sm transition-all duration-300 ${
                        isUsed 
                          ? 'opacity-60 grayscale' 
                          : 'hover:shadow-md hover:border-stone-300'
                      }`}
                    >
                      {/* Cắt hình tròn làm vé xe (Circular cutouts on top/bottom card borders) */}
                      <div className="absolute top-0 left-[30%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#faf8f5] border border-stone-200 rounded-full z-10"></div>
                      <div className="absolute bottom-0 left-[30%] -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-[#faf8f5] border border-stone-200 rounded-full z-10"></div>

                      {/* Phần Cuống Vé (Left side of the ticket - the value) */}
                      <div className={`w-[30%] flex flex-col justify-center items-center text-white px-3 select-none text-center relative overflow-hidden transition-colors ${
                        isUsed 
                          ? 'bg-stone-400' 
                          : 'bg-[#2C4A3B]'
                      }`}>
                        {/* Hiệu ứng vector mờ trang trí phía dưới */}
                        <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                          <Tag size={80} className="transform rotate-12" />
                        </div>
                        
                        <span className="text-2xl font-serif font-black tracking-tight z-10 leading-none">
                          {isPercent ? `${Number(coupon.discount_value)}%` : `${Number(coupon.discount_value) / 1000}k`}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-widest mt-1.5 opacity-90 z-10 whitespace-nowrap">
                          {isPercent ? 'Giảm tối đa' : 'Giảm thẳng'}
                        </span>
                        {!isPercent && (
                          <span className="text-[8px] opacity-75 z-10 mt-0.5">
                            đơn hàng
                          </span>
                        )}
                        {isPercent && coupon.max_discount_amount && (
                          <span className="text-[8px] opacity-75 z-10 mt-0.5 whitespace-nowrap">
                            Tối đa {Number(coupon.max_discount_amount) / 1000}k
                          </span>
                        )}
                      </div>

                      {/* Đường xé răng cưa ngăn cách giữa hai phần (Dashed divider line) */}
                      <div className="w-[1px] border-r border-dashed border-stone-300 my-4 relative"></div>

                      {/* Phần Thân Vé (Right side of the ticket - info & button) */}
                      <div className="w-[70%] p-4 flex flex-col justify-between flex-grow bg-white">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-serif font-bold text-stone-900 leading-tight block text-sm uppercase tracking-wide truncate max-w-[80%]">
                              Mã: {coupon.code}
                            </span>
                            {isAlmostOut && !isUsed && (
                              <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1 py-0.5 rounded leading-none uppercase tracking-wide shrink-0">
                                Sắp hết
                              </span>
                            )}
                            {isUsed && (
                              <span className="bg-stone-100 text-stone-600 text-[8px] font-bold px-1 py-0.5 rounded leading-none uppercase tracking-wide shrink-0">
                                Đã dùng
                              </span>
                            )}
                          </div>
                          
                          <p className="text-stone-600 font-medium text-[11px] leading-relaxed line-clamp-2">
                            Đơn hàng từ {formatPrice(coupon.min_order_amount)}.
                          </p>
                          
                          <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium mt-1">
                            <Calendar size={10} className="shrink-0" />
                            <span>Hạn dùng: {formatDate(coupon.end_date)}</span>
                          </div>
                        </div>

                        {/* Thanh Tiến độ sử dụng */}
                        {!isUsed && coupon.usage_limit > 0 && (
                          <div className="w-full space-y-1 mt-2">
                            <div className="flex justify-between text-[8px] text-stone-400 font-bold uppercase tracking-wider">
                              <span>Số lượng có hạn</span>
                              <span>Đã dùng {usagePercentage}%</span>
                            </div>
                            <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isAlmostOut ? 'bg-red-500' : 'bg-[#2C4A3B]'}`} 
                                style={{ width: `${usagePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Các nút hành động */}
                        <div className="flex gap-2 mt-3 pt-2 border-t border-stone-100">
                          {isUsed ? (
                            <button
                              disabled
                              className="w-full py-1.5 bg-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed border-0 text-center flex items-center justify-center gap-1"
                            >
                              Đã áp dụng đơn hàng trước
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCopyCode(coupon.id, coupon.code, isUsed)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  isCopied 
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-white border-stone-200 hover:border-stone-900 text-stone-700 hover:text-stone-900'
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <Check size={11} className="animate-scale" />
                                    Đã sao chép
                                  </>
                                ) : (
                                  <>
                                    <Copy size={10} />
                                    Sao chép mã
                                  </>
                                )}
                              </button>

                              {user && (
                                <button
                                  onClick={() => handleUseNow(coupon.code)}
                                  className="py-1.5 px-3 bg-[#2C4A3B] hover:bg-[#1e3529] text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1 border-0 cursor-pointer"
                                >
                                  Dùng ngay
                                  <ChevronRight size={10} />
                                </button>
                              )}
                            </>
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

        {/* Hướng dẫn sử dụng */}
        <div className="mt-20 border-t border-stone-200 pt-12 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Info size={16} className="text-[#2C4A3B]" />
            <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-stone-800">
              Hướng dẫn áp dụng mã giảm giá
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-600 font-serif font-bold mx-auto shadow-sm">
                1
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wide text-stone-700">Sao chép mã</h4>
              <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                Chọn mã giảm giá phù hợp với nhu cầu và nhấn nút <strong>"Sao chép mã"</strong> để copy mã voucher vào khay nhớ tạm.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-600 font-serif font-bold mx-auto shadow-sm">
                2
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wide text-stone-700">Chọn sách & Đặt hàng</h4>
              <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                Duyệt qua danh mục của Bookstore, thêm những đầu sách ưa thích vào giỏ hàng và tiến hành thủ tục thanh toán.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-600 font-serif font-bold mx-auto shadow-sm">
                3
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wide text-stone-700">Dán mã & Nhận giảm giá</h4>
              <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                Tại giao diện Trang thanh toán, dán mã đã copy vào mục <strong>"Mã giảm giá"</strong> và nhấn Áp dụng để khấu trừ số tiền được ưu đãi.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
