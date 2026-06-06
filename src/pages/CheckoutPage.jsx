import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { fetchCartCount } = useCart();
  const toast = useToast();
  const { user } = useAuth();

  // Trích xuất sách được chọn và coupon được truyền sang từ Giỏ hàng
  const selectedBookIds = location.state?.selectedBookIds || [];
  const passedCouponCode = location.state?.couponCode || '';

  // State cho thông tin giao hàng
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD'); // Mặc định là COD
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  // State cho mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.warning('Vui lòng nhập mã giảm giá', { title: 'Lỗi áp dụng mã' });
      return;
    }
    try {
      const response = await api.get(`/coupons/validate?code=${couponCode.trim()}&orderAmount=${totalAmount}`);
      const couponData = response.data.data;
      setAppliedCoupon(couponData);
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

  // Tự động pre-fill tên, số điện thoại, địa chỉ từ profile của user khi user đăng nhập
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const profile = response.data.data;
        if (profile) {
          setShippingName(profile.full_name || '');
          setShippingPhone(profile.phone || '');
          setShippingAddress(profile.address || '');
        }
      } catch (err) {
        console.error('Không thể lấy thông tin profile để pre-fill:', err);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // 1. Fetch chi tiết giỏ hàng hiện tại (được giữ kho)
  const { data: cartData, isLoading, isError } = useQuery({
    queryKey: ['cartDetail'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data.data;
    }
  });

  // Lọc sản phẩm hiển thị dựa theo danh sách sách được chọn thanh toán từ giỏ hàng
  const cartItems = (cartData?.items || []).filter(item => {
    if (selectedBookIds.length === 0) return true;
    const id = item.hashId || item.book?.hashId || item.bookId || item.book?.id;
    return selectedBookIds.includes(id);
  });

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.price || item.book?.price || 0) * item.quantity,
    0
  );

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotalAmount = Math.max(0, totalAmount - discountAmount);

  // Tự động áp dụng mã giảm giá đã kích hoạt từ Trạm Khuyến Mãi hoặc truyền từ giỏ hàng sang
  useEffect(() => {
    const couponToUse = passedCouponCode || localStorage.getItem('active_coupon_code');
    if (couponToUse && totalAmount > 0 && !appliedCoupon) {
      const autoValidate = async () => {
        try {
          const response = await api.get(`/coupons/validate?code=${couponToUse.trim()}&orderAmount=${totalAmount}`);
          setAppliedCoupon(response.data.data);
          setCouponCode(couponToUse);
          if (passedCouponCode) {
            toast.success(`Đã áp dụng mã giảm giá từ giỏ hàng: "${couponToUse}"!`);
          } else {
            toast.success(`Đã tự động áp dụng mã giảm giá "${couponToUse}"!`);
            localStorage.removeItem('active_coupon_code');
          }
        } catch (err) {
          setCouponCode(couponToUse);
          console.log('Tự động áp dụng mã giảm giá thất bại:', err.response?.data?.error);
        }
      };
      autoValidate();
    }
  }, [totalAmount, passedCouponCode]);

  // 2. Mutation đặt hàng & lấy link thanh toán
  const orderMutation = useMutation({
    mutationFn: async (shippingInfo) => {
      // BƯỚC 1: Tạo đơn hàng với thông tin giao hàng, phương thức thanh toán và sách được chọn
      const orderRes = await api.post('/orders/checkout', {
        shippingName: shippingInfo.shippingName,
        shippingPhone: shippingInfo.shippingPhone,
        shippingAddress: shippingInfo.shippingAddress,
        shippingNotes: shippingInfo.shippingNotes,
        paymentMethod: shippingInfo.paymentMethod,
        couponCode: shippingInfo.couponCode, // Truyền mã giảm giá
        selectedBookIds: selectedBookIds.length > 0 ? selectedBookIds : null
      });
      const order = orderRes.data.data;

      // BƯỚC 2: Nếu người dùng check lưu làm mặc định, cập nhật profile
      if (shippingInfo.saveAsDefault) {
        try {
          await api.put('/users/profile', {
            full_name: shippingInfo.shippingName,
            phone: shippingInfo.shippingPhone,
            address: shippingInfo.shippingAddress
          });
        } catch (err) {
          console.error('Lỗi khi lưu thông tin mặc định:', err);
        }
      }

      if (shippingInfo.paymentMethod === 'COD') {
        return { isCOD: true };
      }

      // BƯỚC 3: Tạo link thanh toán cho đơn hàng đó (nếu là ONLINE)
      const paymentRes = await api.get(`/payments/url/${order.hashId || order.id}`);
      return { isCOD: false, paymentUrl: paymentRes.data.paymentUrl };
    },
    onSuccess: (res) => {
      // Làm sạch số lượng giỏ hàng trên Navbar
      queryClient.invalidateQueries(['cartDetail']);
      fetchCartCount();
      // Xóa cache selection giỏ hàng vì đơn hàng đã được đặt thành công
      sessionStorage.removeItem('selected_cart_book_ids');
      
      if (res.isCOD) {
        toast.success('Đặt hàng thành công!');
        navigate('/payment-result?status=success');
      } else {
        // Chuyển hướng sang Cổng thanh toán giả lập
        window.location.href = res.paymentUrl;
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Đặt hàng thất bại' });
    }
  });

  const handleConfirmOrder = () => {
    if (cartItems.length === 0) return;

    // Validate thông tin giao nhận hàng
    if (!shippingName.trim()) {
      toast.warning('Vui lòng nhập họ tên người nhận', { title: 'Thông tin không hợp lệ' });
      return;
    }
    if (!shippingPhone.trim()) {
      toast.warning('Vui lòng nhập số điện thoại nhận hàng', { title: 'Thông tin không hợp lệ' });
      return;
    }
    // Kiểm tra định dạng số điện thoại Việt Nam đơn giản (10 chữ số)
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(shippingPhone.trim().replace(/\s+/g, ''))) {
      toast.warning('Số điện thoại không hợp lệ (VD: 0987654321)', { title: 'Thông tin không hợp lệ' });
      return;
    }
    if (!shippingAddress.trim()) {
      toast.warning('Vui lòng nhập địa chỉ giao hàng', { title: 'Thông tin không hợp lệ' });
      return;
    }

    orderMutation.mutate({
      shippingName: shippingName.trim(),
      shippingPhone: shippingPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      shippingNotes: shippingNotes.trim(),
      paymentMethod,
      saveAsDefault,
      couponCode: appliedCoupon ? appliedCoupon.code : null
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 flex-grow w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2C4A3B] border-t-transparent"></div>
      </div>
    );
  }

  if ((isError || cartItems.length === 0) && !orderMutation.isPending && !orderMutation.isSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="border border-[#2C4A3B]/20 p-10 rounded-none bg-white inline-block max-w-md">
          <p className="text-lg font-serif font-medium text-ink mb-3">Giỏ hàng trống hoặc có lỗi xảy ra</p>
          <p className="text-ink-light text-sm mb-8">Bạn chưa có sản phẩm nào được giữ kho để thanh toán.</p>
          <Link to="/" state={{ scrollTo: 'explore' }} className="inline-block bg-[#2C4A3B] hover:bg-[#1e3529] text-white px-6 py-3 rounded-none transition-colors text-sm uppercase tracking-wider font-medium">
            Quay lại Cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 flex-grow w-full">
      <h1 className="text-3xl font-serif font-medium text-ink mb-10 border-b border-divider pb-6">XÁC NHẬN ĐƠN HÀNG</h1>

      {/* Cảnh báo thiếu thông tin nhận hàng */}
      {(!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) && (
        <div className="border border-[#2C4A3B] bg-[#fdfaf7] rounded-none p-5 mb-8 flex gap-3 text-sm text-[#2C4A3B]">
          <span className="text-lg">⚠️</span>
          <div className="leading-relaxed">
            <h4 className="font-serif font-bold uppercase tracking-wider text-xs mb-1">Thiếu thông tin nhận hàng</h4>
            <p>
              Tài khoản chưa có thông tin nhận hàng mặc định hoặc thông tin đang bị trống. Vui lòng điền đầy đủ <strong>Họ tên người nhận</strong>, <strong>Số điện thoại</strong> và <strong>Địa chỉ giao hàng</strong> ở khung bên dưới để có thể Đặt hàng.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-divider rounded-none shadow-none overflow-hidden mb-8">
        <div className="p-6 border-b border-divider bg-surface-warm">
          <h2 className="font-serif font-medium text-ink text-base">Sản phẩm thanh toán</h2>
        </div>
        <div className="divide-y divide-divider">
          {cartItems.map((item) => {
            const bookId = item.bookId || item.book?.id;
            const bookTitle = item.book?.title || 'Cuốn sách';
            const bookPrice = Number(item.price || item.book?.price || 0);

            return (
              <div key={item.id} className="p-6 flex justify-between items-center gap-4 hover:bg-surface-warm/30 transition-colors">
                <div>
                  <h4 className="font-serif font-semibold text-ink hover:text-[#2C4A3B] transition-colors line-clamp-1">
                    {bookTitle}
                  </h4>
                  <p className="text-ink-light text-xs mt-1">
                    Số lượng: <span className="font-semibold text-ink">{item.quantity}</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-serif font-bold text-ink">
                    {(bookPrice * item.quantity).toLocaleString('vi-VN')} đ
                  </p>
                  <p className="text-ink-light text-xs">
                    {bookPrice.toLocaleString('vi-VN')} đ / cuốn
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Thông tin giao hàng */}
      <div className="bg-white border border-divider rounded-none shadow-none overflow-hidden mb-8">
        <div className="p-6 border-b border-divider bg-surface-warm">
          <h2 className="font-serif font-medium text-ink text-base">Thông tin giao nhận hàng</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-semibold">Họ và tên người nhận <span className="text-[#2C4A3B]">*</span></label>
              <input
                type="text"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink font-sans placeholder-ink-light/40"
                placeholder="VD: Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-semibold">Số điện thoại nhận hàng <span className="text-[#2C4A3B]">*</span></label>
              <input
                type="tel"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink font-sans placeholder-ink-light/40"
                placeholder="VD: 0987654321"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-semibold">Địa chỉ giao hàng <span className="text-[#2C4A3B]">*</span></label>
            <textarea
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink font-sans placeholder-ink-light/40 resize-none"
              placeholder="Nhập địa chỉ nhận hàng chi tiết (Số nhà, ngõ/đường, phường/xã, quận/huyện, tỉnh/thành phố...)"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-semibold">Ghi chú giao hàng (Tùy chọn)</label>
            <textarea
              rows={2}
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
              className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink font-sans placeholder-ink-light/40 resize-none"
              placeholder="VD: Giao giờ hành chính, gọi trước khi giao..."
            />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-divider/50">
            <input
              id="saveDefault"
              type="checkbox"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
              className="w-4 h-4 accent-[#2C4A3B] rounded-none cursor-pointer"
            />
            <label htmlFor="saveDefault" className="text-xs text-ink-light cursor-pointer select-none">
              Lưu thông tin giao hàng này làm địa chỉ mặc định cho tài khoản
            </label>
          </div>
        </div>
      </div>

      {/* Bộ chọn Phương thức thanh toán */}
      <div className="bg-white border border-divider rounded-none shadow-none overflow-hidden mb-8">
        <div className="p-6 border-b border-divider bg-surface-warm">
          <h2 className="font-serif font-medium text-ink text-base">Phương thức thanh toán</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div
              onClick={() => setPaymentMethod('COD')}
              className={`p-5 border cursor-pointer transition-all flex flex-col justify-between h-28 rounded-none ${
                paymentMethod === 'COD'
                  ? 'border-[#2C4A3B] bg-[#fdfaf7]'
                  : 'border-divider bg-white hover:bg-surface-warm/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-serif font-semibold text-sm text-ink uppercase tracking-wider">Tiền mặt (COD)</span>
                <span className="text-xl">💵</span>
              </div>
              <p className="text-xs text-ink-light leading-relaxed">
                Thanh toán bằng tiền mặt khi nhận hàng.
              </p>
            </div>

            <div
              onClick={() => setPaymentMethod('ONLINE')}
              className={`p-5 border cursor-pointer transition-all flex flex-col justify-between h-28 rounded-none ${
                paymentMethod === 'ONLINE'
                  ? 'border-[#2C4A3B] bg-[#fdfaf7]'
                  : 'border-divider bg-white hover:bg-surface-warm/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-serif font-semibold text-sm text-ink uppercase tracking-wider">Chuyển khoản (Online)</span>
                <span className="text-xl">💳</span>
              </div>
              <p className="text-xs text-ink-light leading-relaxed">
                Thanh toán chuyển khoản nhanh qua cổng PayOS (VietQR) tự động.
              </p>
            </div>
          </div>

          <div className="p-4 bg-surface-warm text-xs text-ink-light border border-divider rounded-none">
            {paymentMethod === 'COD' ? (
              <p className="leading-relaxed">
                📍 Bạn đã chọn thanh toán <strong>Tiền mặt khi nhận hàng (COD)</strong>. Đơn hàng sẽ được xác nhận ngay lập tức sau khi bấm đặt hàng và các sách tương ứng trong giỏ sẽ được dọn sạch.
              </p>
            ) : (
              <p className="leading-relaxed">
                🌐 Bạn đã chọn thanh toán <strong>Chuyển khoản (Online)</strong>. Sau khi bấm đặt hàng, hệ thống sẽ chuyển hướng bạn sang cổng thanh toán <strong>PayOS</strong> hiển thị mã <strong>VietQR</strong> để quét mã chuyển khoản nhanh 24/7. Các sách tương ứng trong giỏ chỉ được dọn sạch khi thanh toán thành công.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-divider rounded-none p-8 shadow-none mb-8">
        <h3 className="font-serif font-medium text-base text-ink mb-4 pb-4 border-b border-divider">Tóm tắt thanh toán</h3>
        
        {/* Khung nhập mã giảm giá */}
        <div className="mb-6 pb-6 border-b border-divider">
          <label className="block text-xs uppercase tracking-wider text-ink-light mb-2 font-semibold">
            Mã giảm giá (Voucher)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={!!appliedCoupon}
              className="flex-grow border border-divider rounded-none px-4 py-2 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink uppercase placeholder-ink-light/40"
              placeholder="Nhập mã giảm giá (VD: GIAM10)"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="bg-surface-warm hover:bg-[#f0ece7] text-ink border border-divider text-xs uppercase tracking-wider px-4 font-semibold rounded-none transition-colors"
              >
                Hủy
              </button>
            ) : (
              <button
                type="button"
                onClick={handleValidateCoupon}
                className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white text-xs uppercase tracking-wider px-5 font-semibold rounded-none transition-colors"
              >
                Áp dụng
              </button>
            )}
          </div>
          {appliedCoupon && (
            <p className="text-xs text-[#2C4A3B] mt-2 font-medium flex items-center gap-1">
              <span>✓</span> Đã áp dụng mã <strong>{appliedCoupon.code}</strong> (Giảm {appliedCoupon.discountAmount.toLocaleString('vi-VN')} đ)
            </p>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-ink-light text-sm">
            <span>Tổng tiền sách</span>
            <span>{totalAmount.toLocaleString('vi-VN')} đ</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-[#2C4A3B] text-sm font-semibold">
              <span>Giảm giá</span>
              <span>-{appliedCoupon.discountAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
          <div className="flex justify-between text-ink-light text-sm">
            <span>Phí dịch vụ</span>
            <span className="font-medium text-[#2C4A3B]">Miễn phí</span>
          </div>
          <div className="border-t border-divider pt-4 flex justify-between font-serif font-bold text-xl text-ink">
            <span>Tổng thanh toán</span>
            <span className="text-[#2C4A3B]">{finalTotalAmount.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {paymentMethod === 'ONLINE' && (
          <div className="border border-dashed border-[#2C4A3B]/30 bg-surface-warm rounded-none p-5 mb-8 flex gap-3 text-sm text-ink-light">
            <span className="text-lg">🛡️</span>
            <p className="leading-relaxed">
              Đơn hàng sẽ được chuyển hướng an toàn tới cổng thanh toán đối tác <strong>PayOS</strong> để quét mã VietQR. Giao dịch được bảo mật và xử lý tự động.
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="flex-1 bg-surface-warm hover:bg-[#f0ece7] text-ink border border-divider font-medium py-3 px-4 rounded-none transition-colors text-sm uppercase tracking-wider"
            disabled={orderMutation.isPending}
          >
            Quay lại Giỏ hàng
          </button>
          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={orderMutation.isPending || !shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()}
            className="flex-[2] bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-3 px-4 rounded-none transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            {orderMutation.isPending ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Đang xử lý đơn hàng...
              </>
            ) : (
              paymentMethod === 'COD' ? 'Xác nhận Đặt hàng (COD)' : 'Đặt hàng & Thanh toán'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
