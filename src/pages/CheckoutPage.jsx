import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/image';
import { Check, CreditCard, DollarSign, ArrowLeft, ShieldCheck, Ticket, X, AlertTriangle } from 'lucide-react';

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
  const [shippingEmail, setShippingEmail] = useState(''); // Trường Email mới
  
  // Địa chỉ chia nhỏ (Mới - Giúp nhập liệu chuyên nghiệp)
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  const [shippingNotes, setShippingNotes] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('ANYTIME'); // Khung giờ giao mới
  
  // Thông tin xuất hóa đơn VAT (Mới - Chuyên nghiệp doanh nghiệp)
  const [requestVAT, setRequestVAT] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('COD'); // Mặc định là COD
  const [saveAsDefault, setSaveAsDefault] = useState(true); // Hợp lý hóa UX: Mặc định bật để người dùng tự động lưu địa chỉ cho lần sau

  // State cho mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Fetch danh sách mã giảm giá đang hoạt động
  const { data: couponsData } = useQuery({
    queryKey: ['activeCoupons'],
    queryFn: async () => {
      const response = await api.get('/coupons/active');
      return response.data?.data || [];
    }
  });
  const activeCoupons = couponsData || [];

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

  // Tự động pre-fill tên, số điện thoại, địa chỉ từ profile của user hoặc từ localStorage dự phòng
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const profile = response.data.data;
        
        let name = '';
        let phone = '';
        let email = '';
        let addressStr = '';

        if (profile) {
          name = profile.full_name || '';
          phone = profile.phone || '';
          email = profile.email || '';
          addressStr = profile.address || '';
        }

        // Nếu thông tin trong DB trống, tải thông tin từ localStorage của phiên checkout trước đó (fallback cache)
        const localInfoStr = localStorage.getItem('last_shipping_info');
        if (localInfoStr) {
          try {
            const localInfo = JSON.parse(localInfoStr);
            if (!name) name = localInfo.name || '';
            if (!phone) phone = localInfo.phone || '';
            if (!email) email = localInfo.email || '';
            if (!addressStr && localInfo.address) addressStr = localInfo.address || '';
          } catch (e) {
            console.error('Lỗi khi khôi phục thông tin giao hàng từ localStorage:', e);
          }
        }

        setShippingName(name);
        setShippingPhone(phone);
        setShippingEmail(email);
        
        if (addressStr) {
          // Thử tự động tách địa chỉ nếu được phân cách bằng dấu phẩy
          const parts = addressStr.split(',').map(p => p.trim());
          if (parts.length >= 4) {
            setStreetAddress(parts.slice(0, parts.length - 3).join(', '));
            setWard(parts[parts.length - 3]);
            setDistrict(parts[parts.length - 2]);
            setProvince(parts[parts.length - 1]);
          } else {
            setStreetAddress(addressStr);
          }
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

      // BƯỚC 2: Nếu người dùng check lưu làm mặc định, cập nhật profile trong DB
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

      // Luôn lưu lại thông tin giao nhận vào localStorage của trình duyệt làm fallback dự phòng
      try {
        localStorage.setItem('last_shipping_info', JSON.stringify({
          name: shippingInfo.shippingName,
          phone: shippingInfo.shippingPhone,
          email: shippingInfo.shippingEmail,
          address: shippingInfo.shippingAddress
        }));
      } catch (err) {
        console.error('Lỗi khi lưu last_shipping_info vào localStorage:', err);
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
    if (shippingEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shippingEmail.trim())) {
        toast.warning('Email liên hệ không hợp lệ (VD: example@mail.com)', { title: 'Thông tin không hợp lệ' });
        return;
      }
    }
    if (!streetAddress.trim() || !ward.trim() || !district.trim() || !province.trim()) {
      toast.warning('Vui lòng điền đầy đủ các thông tin địa chỉ giao nhận', { title: 'Thông tin không hợp lệ' });
      return;
    }
    if (requestVAT) {
      if (!companyName.trim() || !taxCode.trim() || !companyAddress.trim()) {
        toast.warning('Vui lòng điền đầy đủ thông tin doanh nghiệp xuất hóa đơn VAT', { title: 'Thông tin không hợp lệ' });
        return;
      }
    }

    // Tạo địa chỉ đầy đủ từ các trường chia nhỏ
    const combinedAddress = [streetAddress.trim(), ward.trim(), district.trim(), province.trim()]
      .filter(Boolean)
      .join(', ');

    // Gộp thời gian giao hàng, email, VAT vào phần ghi chú
    const deliveryLabels = {
      ANYTIME: 'Giao mọi lúc',
      OFFICE_HOURS: 'Giao giờ hành chính (8h-17h)',
      OUTSIDE_OFFICE: 'Giao ngoài giờ / Cuối tuần'
    };

    let combinedNotes = `[Hạn Giao: ${deliveryLabels[deliveryTime]}]`;
    if (shippingEmail.trim()) {
      combinedNotes += ` [Email: ${shippingEmail.trim()}]`;
    }
    if (shippingNotes.trim()) {
      combinedNotes += ` Ghi chú: ${shippingNotes.trim()}`;
    }
    if (requestVAT) {
      combinedNotes += ` \n[VAT] Tên CT: ${companyName.trim()} | MST: ${taxCode.trim()} | ĐC: ${companyAddress.trim()}`;
    }

    orderMutation.mutate({
      shippingName: shippingName.trim(),
      shippingPhone: shippingPhone.trim(),
      shippingEmail: shippingEmail.trim(),
      shippingAddress: combinedAddress,
      shippingNotes: combinedNotes,
      paymentMethod,
      saveAsDefault,
      couponCode: appliedCoupon ? appliedCoupon.code : null
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 flex-grow w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2C4A3B] border-t-transparent"></div>
      </div>
    );
  }

  if ((isError || cartItems.length === 0) && !orderMutation.isPending && !orderMutation.isSuccess) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4 text-center flex-grow w-full">
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
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full bg-[#fdfcfa]">
      {/* Header */}
      <div className="mb-10 border-b border-divider pb-6 text-center md:text-left">
        <span className="text-[10px] text-stone-500 font-sans tracking-[0.2em] uppercase font-bold">Thủ tục thanh toán</span>
        <h1 className="text-3xl font-serif font-bold text-ink mt-1">XÁC NHẬN ĐƠN HÀNG</h1>
      </div>

      {/* Cảnh báo thiếu thông tin nhận hàng */}
      {(!shippingName.trim() || !shippingPhone.trim() || !streetAddress.trim() || !ward.trim() || !district.trim() || !province.trim()) && (
        <div className="border border-amber-300 bg-amber-50/40 rounded-none p-5 mb-8 flex gap-3 text-sm text-amber-800">
          <span className="text-lg">⚠️</span>
          <div className="leading-relaxed">
            <h4 className="font-serif font-bold uppercase tracking-wider text-xs mb-1">Thiếu thông tin nhận hàng</h4>
            <p>
              Tài khoản chưa có thông tin nhận hàng mặc định hoặc thông tin đang bị thiếu. Vui lòng điền đầy đủ <strong>Họ tên</strong>, <strong>Số điện thoại</strong> và <strong>Địa chỉ giao hàng chi tiết</strong> ở khung bên dưới để có thể Đặt hàng.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout 2 Cột */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cột trái (7 cột): Form thông tin & Phương thức thanh toán */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Thông tin giao nhận hàng */}
          <div className="bg-white border border-divider rounded-none shadow-none">
            <div className="p-5 border-b border-divider bg-[#faf8f5]">
              <h2 className="font-serif font-bold text-ink text-sm uppercase tracking-widest">1. Thông tin giao nhận hàng</h2>
            </div>
            <div className="p-6 space-y-5">
              
              {/* Họ tên & SĐT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Họ và tên người nhận <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Số điện thoại nhận hàng <span className="text-red-600">*</span></label>
                  <input
                    type="tel"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400"
                    placeholder="0987654321"
                    required
                  />
                </div>
              </div>

              {/* Email liên hệ (Trường mới) */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Địa chỉ Email liên hệ (Không bắt buộc)</label>
                <input
                  type="email"
                  value={shippingEmail}
                  onChange={(e) => setShippingEmail(e.target.value)}
                  className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400"
                  placeholder="name@example.com (Dùng để nhận hóa đơn & thông tin vận đơn)"
                />
              </div>

              {/* Tỉnh/Thành & Quận/Huyện */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Tỉnh / Thành phố <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400"
                    placeholder="Ví dụ: Hà Nội"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Quận / Huyện <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400"
                    placeholder="Ví dụ: Quận Cầu Giấy"
                    required
                  />
                </div>
              </div>

              {/* Phường/Xã & Địa chỉ cụ thể */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Phường / Xã / Thị trấn <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400"
                    placeholder="Ví dụ: Phường Dịch Vọng"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Số nhà, Tên đường cụ thể <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400"
                    placeholder="Ví dụ: Số 12, Ngõ 45 Trần Thái Tông"
                    required
                  />
                </div>
              </div>

              {/* Thời gian nhận hàng ưa thích (Trường mới) */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Khung giờ giao hàng mong muốn</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'ANYTIME', label: 'Mọi lúc (Tối ưu nhất)', desc: 'Giao giờ hành chính hoặc tối' },
                    { id: 'OFFICE_HOURS', label: 'Giờ hành chính', desc: 'Từ 8h00 - 17h00' },
                    { id: 'OUTSIDE_OFFICE', label: 'Ngoài giờ / Cuối tuần', desc: 'Sau 17h00 & T7/CN' },
                  ].map((option) => (
                    <label 
                      key={option.id}
                      className={`flex flex-col p-3 border cursor-pointer transition-all ${
                        deliveryTime === option.id 
                          ? 'border-[#2C4A3B] bg-[#fdfbf9]' 
                          : 'border-divider hover:bg-stone-50 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name="deliveryTime" 
                          checked={deliveryTime === option.id}
                          onChange={() => setDeliveryTime(option.id)}
                          className="w-3.5 h-3.5 text-[#2C4A3B] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-ink">{option.label}</span>
                      </div>
                      <span className="text-[9px] text-ink-light mt-1.5">{option.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ghi chú giao hàng */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-bold">Ghi chú vận chuyển (Tùy chọn)</label>
                <textarea
                  rows={2}
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                  className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-colors bg-white text-ink font-sans placeholder-stone-400 resize-none"
                  placeholder="Ví dụ: Gọi điện trước khi giao 15 phút, nếu không nghe máy vui lòng gửi ở bảo vệ..."
                />
              </div>

              {/* Xuất hóa đơn VAT (Trường mới) */}
              <div className="pt-2 border-t border-divider-lt">
                <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                  <input
                    type="checkbox"
                    checked={requestVAT}
                    onChange={(e) => setRequestVAT(e.target.checked)}
                    className="w-4 h-4 accent-[#2C4A3B] cursor-pointer"
                  />
                  <div className="text-[11px] font-bold text-ink uppercase tracking-wider">
                    Yêu cầu xuất hóa đơn giá trị gia tăng (VAT)
                  </div>
                </label>

                {requestVAT && (
                  <div className="mt-4 p-4 bg-[#faf8f5] border border-divider space-y-3.5 animate-fade-in">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-ink-light mb-1 font-bold">Tên doanh nghiệp / Công ty <span className="text-red-600">*</span></label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full border border-divider rounded-none px-3 py-1.5 text-xs focus:outline-none focus:border-[#2C4A3B] bg-white text-ink"
                        placeholder="Công ty Cổ phần Công nghệ..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-ink-light mb-1 font-bold">Mã số thuế <span className="text-red-600">*</span></label>
                        <input
                          type="text"
                          value={taxCode}
                          onChange={(e) => setTaxCode(e.target.value)}
                          className="w-full border border-divider rounded-none px-3 py-1.5 text-xs focus:outline-none focus:border-[#2C4A3B] bg-white text-ink font-mono"
                          placeholder="Mã số thuế doanh nghiệp..."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider text-ink-light mb-1 font-bold">Địa chỉ đăng ký kinh doanh <span className="text-red-600">*</span></label>
                        <input
                          type="text"
                          value={companyAddress}
                          onChange={(e) => setCompanyAddress(e.target.value)}
                          className="w-full border border-divider rounded-none px-3 py-1.5 text-xs focus:outline-none focus:border-[#2C4A3B] bg-white text-ink"
                          placeholder="Địa chỉ trên giấy phép kinh doanh..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox lưu mặc định */}
              <div className="flex items-center gap-2.5 pt-4 border-t border-divider-lt">
                <input
                  id="saveDefault"
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="w-4 h-4 accent-[#2C4A3B] rounded-none cursor-pointer"
                />
                <label htmlFor="saveDefault" className="text-xs text-ink-light cursor-pointer select-none">
                  Lưu thông tin giao nhận này làm mặc định cho tài khoản
                </label>
              </div>

            </div>
          </div>

          {/* Section 2: Phương thức thanh toán */}
          <div className="bg-white border border-divider rounded-none shadow-none">
            <div className="p-5 border-b border-divider bg-[#faf8f5]">
              <h2 className="font-serif font-bold text-ink text-sm uppercase tracking-widest">2. Phương thức thanh toán</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option COD */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 border cursor-pointer transition-all flex items-start justify-between rounded-none relative ${
                    paymentMethod === 'COD'
                      ? 'border-[#2C4A3B] bg-[#fdfbf9] shadow-[0_2px_8px_rgba(44,74,59,0.05)]'
                      : 'border-divider bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-serif font-bold text-xs text-ink uppercase tracking-wider block">Tiền mặt (COD)</span>
                    <p className="text-[10px] text-ink-light leading-relaxed">
                      Thanh toán trực tiếp bằng tiền mặt khi nhận sách.
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                    paymentMethod === 'COD' ? 'border-[#2C4A3B] bg-[#2C4A3B] text-white' : 'border-stone-300 bg-white'
                  }`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                </div>

                {/* Option ONLINE */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-4 border cursor-pointer transition-all flex items-start justify-between rounded-none relative ${
                    paymentMethod === 'ONLINE'
                      ? 'border-[#2C4A3B] bg-[#fdfbf9] shadow-[0_2px_8px_rgba(44,74,59,0.05)]'
                      : 'border-divider bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-serif font-bold text-xs text-ink uppercase tracking-wider block">Chuyển khoản (PayOS)</span>
                    <p className="text-[10px] text-ink-light leading-relaxed">
                      Thanh toán chuyển khoản qua QR Code tự động 24/7.
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                    paymentMethod === 'ONLINE' ? 'border-[#2C4A3B] bg-[#2C4A3B] text-white' : 'border-stone-300 bg-white'
                  }`}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                </div>

              </div>

              {/* Thông tin mô tả hình thức thanh toán */}
              <div className="p-4 bg-[#faf8f5] text-xs text-ink-light border border-divider-lt rounded-none flex gap-2.5">
                <span className="text-sm">💡</span>
                {paymentMethod === 'COD' ? (
                  <p className="leading-relaxed">
                    Bạn đã chọn thanh toán <strong>Tiền mặt khi nhận hàng (COD)</strong>. Đơn hàng của bạn sẽ được kích hoạt xử lý đóng gói và giao ngay.
                  </p>
                ) : (
                  <p className="leading-relaxed">
                    Bạn đã chọn thanh toán <strong>Chuyển khoản trực tuyến</strong>. Hệ thống sẽ tự động hiển thị mã <strong>VietQR</strong> từ cổng PayOS để bạn quét và xác nhận giao dịch tự động trong 10 giây.
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Cột phải (5 cột): Tóm tắt đơn hàng & Mã giảm giá */}
        <div className="lg:col-span-5 bg-[#faf8f5] border border-divider p-6 sticky top-24 space-y-6">
          
          {/* Header tóm tắt */}
          <div>
            <h3 className="font-serif font-bold text-sm text-ink uppercase tracking-widest pb-3.5 border-b border-divider">
              Tóm tắt đơn hàng ({cartItems.length} sản phẩm)
            </h3>
          </div>

          {/* Danh sách sản phẩm thanh toán rút gọn */}
          <div className="max-h-60 overflow-y-auto divide-y divide-divider-lt pr-1">
            {cartItems.map((item) => {
              const bookTitle = item.book?.title || 'Cuốn sách';
              const bookAuthor = item.book?.author || 'Tác giả';
              const bookPrice = Number(item.price || item.book?.price || 0);
              const bookCover = item.book?.cover_url || item.cover_url;

              return (
                <div key={item.id} className="py-3.5 flex items-start gap-3.5">
                  <div className="w-12 h-16 bg-white border border-divider-lt flex-shrink-0 overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.03)] relative">
                    <img 
                      src={bookCover ? getImageUrl(bookCover) : `https://picsum.photos/seed/${item.bookId || item.id}/120/180`} 
                      alt={bookTitle} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-xs text-ink truncate" title={bookTitle}>
                      {bookTitle}
                    </h4>
                    <p className="text-[10px] text-ink-light truncate mt-0.5">{bookAuthor}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px]">
                      <span className="text-ink-light">Số lượng: <strong className="text-ink">{item.quantity}</strong></span>
                      <strong className="text-ink font-mono">{bookPrice.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nhập mã giảm giá */}
          <div className="pt-4 border-t border-divider">
            <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-2 font-bold flex items-center gap-1.5">
              <Ticket size={13} /> Mã giảm giá (Voucher)
            </label>
            {!appliedCoupon ? (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-grow border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink uppercase placeholder-stone-400 font-mono h-9"
                    placeholder="Ví dụ: GIAM20K"
                  />
                  <button
                    type="button"
                    onClick={handleValidateCoupon}
                    className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white text-[10px] uppercase tracking-wider px-4 font-bold rounded-none transition-colors cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="text-[9px] text-[#2C4A3B] hover:underline uppercase tracking-wider font-bold bg-transparent border-0 cursor-pointer p-0"
                  >
                    Chọn từ danh sách ưu đãi
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-green-50/50 border border-green-200 p-3 flex justify-between items-center rounded-none text-xs">
                  <div>
                    <p className="text-[9px] text-[#2C4A3B] font-sans font-bold uppercase tracking-widest">Đang áp dụng</p>
                    <p className="font-serif font-bold text-ink uppercase tracking-wide">{appliedCoupon.code}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[10px] text-red-600 hover:text-red-700 font-sans font-bold uppercase tracking-wider cursor-pointer bg-transparent border-0"
                  >
                    Gỡ bỏ
                  </button>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsVoucherModalOpen(true)}
                    className="text-[9px] text-[#2C4A3B] hover:underline uppercase tracking-wider font-bold bg-transparent border-0 cursor-pointer p-0"
                  >
                    Thay đổi mã giảm giá
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bảng chi tiết giá tiền */}
          <div className="pt-4 border-t border-divider space-y-3 text-xs">
            <div className="flex justify-between text-ink-light">
              <span>Tổng tiền sách</span>
              <span className="font-mono">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-700 font-bold">
                <span>Khấu trừ voucher</span>
                <span className="font-mono">-{appliedCoupon.discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between text-ink-light">
              <span>Phí vận chuyển</span>
              <span className="text-green-700 font-bold uppercase tracking-wider text-[10px]">Miễn phí</span>
            </div>
            
            <div className="border-t border-divider pt-4 flex justify-between items-baseline font-serif font-bold text-lg text-ink">
              <span>Tổng thanh toán</span>
              <span className="text-[#2C4A3B] font-mono text-xl">
                {finalTotalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Cảnh báo bảo mật thanh toán */}
          {paymentMethod === 'ONLINE' && (
            <div className="p-3 bg-stone-50 border border-divider-lt rounded-none flex gap-2.5 text-[10px] text-ink-light leading-relaxed">
              <ShieldCheck size={16} className="text-[#2C4A3B] flex-shrink-0" />
              <p>
                Bạn sẽ được chuyển hướng an toàn tới cổng đối tác <strong>PayOS</strong> để quét mã VietQR. Dữ liệu thanh toán được mã hóa bảo mật SSL.
              </p>
            </div>
          )}

          {/* Cặp nút hành động */}
          <div className="pt-4 space-y-2.5">
            <button
              type="button"
              onClick={handleConfirmOrder}
              disabled={orderMutation.isPending || !shippingName.trim() || !shippingPhone.trim() || !streetAddress.trim() || !ward.trim() || !district.trim() || !province.trim()}
              className="w-full bg-[#2C4A3B] hover:bg-[#1e3529] disabled:bg-stone-300 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-none transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer shadow-[0_3px_12px_rgba(44,74,59,0.15)]"
            >
              {orderMutation.isPending ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                  Đang lập đơn hàng...
                </>
              ) : (
                paymentMethod === 'COD' ? 'Xác nhận Đặt hàng (COD)' : 'Đặt hàng & Thanh toán'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="w-full bg-white hover:bg-stone-50 text-ink-60 hover:text-ink border border-divider font-bold py-3 px-4 rounded-none transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
              disabled={orderMutation.isPending}
            >
              <ArrowLeft size={13} /> Quay lại Giỏ hàng
            </button>
          </div>

        </div>

      </div>
    </div>

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
                type="button"
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
                    type="button"
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
                    const eligible = activeCoupons.filter(c => !c.is_used && totalAmount >= Number(c.min_order_amount));
                    const ineligible = activeCoupons.filter(c => c.is_used || totalAmount < Number(c.min_order_amount));

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
                                    type="button"
                                    onClick={async () => {
                                      setCouponCode(coupon.code);
                                      try {
                                        const response = await api.get(`/coupons/validate?code=${coupon.code}&orderAmount=${totalAmount}`);
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
                              const diff = minAmt - totalAmount;

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
                                    type="button"
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
                type="button"
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
