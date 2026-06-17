import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowUp, X, CheckCircle, HelpCircle, Phone, FileText, Shield, Cookie, ShoppingBag, RotateCcw, CreditCard } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  // State for Support & Policy Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('order_guide');

  // State for Mobile Footer Accordions
  const [expandedSections, setExpandedSections] = useState({
    categories: false,
    support: false,
    account: false
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  // Scroll to top helper
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto scroll to top on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Click handler for category filters
  const handleCategoryClick = (categoryName) => {
    if (location.pathname === '/') {
      // Find explore section
      const exploreElement = document.getElementById('explore');
      if (exploreElement) {
        exploreElement.scrollIntoView({ behavior: 'smooth' });
      }
      // Pass states manually via React Router state (or HomePage listens to it)
      navigate('/', { state: { scrollTo: 'explore', filterCategory: categoryName } });
    } else {
      navigate('/', { state: { scrollTo: 'explore', filterCategory: categoryName } });
    }
  };

  // Open support modal on specific tab
  const openSupport = (tabKey) => {
    setActiveTab(tabKey);
    setModalOpen(true);
  };

  // Support Content configuration
  const tabs = [
    { id: 'order_guide', label: 'Cách đặt hàng', icon: <ShoppingBag size={15} /> },
    { id: 'refund', label: 'Đổi trả hàng', icon: <RotateCcw size={15} /> },
    { id: 'payment', label: 'Thanh toán', icon: <CreditCard size={15} /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle size={15} /> },
    { id: 'contact', label: 'Liên hệ', icon: <Phone size={15} /> },
    { id: 'privacy', label: 'Bảo mật', icon: <Shield size={15} /> },
    { id: 'terms', label: 'Điều khoản', icon: <FileText size={15} /> },
    { id: 'cookie', label: 'Cookie', icon: <Cookie size={15} /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'order_guide':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Hướng Dẫn Đặt Hàng</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Chào mừng bạn đến với <strong>Pigeon Bookstore</strong>. Để sở hữu những tác phẩm tinh hoa, vui lòng thực hiện các bước sau:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-xs text-stone-700">
              <li>
                <strong className="text-[#2C4A3B]">Tìm kiếm và tuyển chọn:</strong> Lướt qua tủ sách tại trang chủ hoặc lọc theo từng thể loại để tìm cuốn sách ưng ý.
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Thêm vào giỏ hàng:</strong> Click vào nút <span className="underline">Thêm vào giỏ</span> trên kệ sách hoặc trang chi tiết sản phẩm.
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Kiểm tra giỏ hàng:</strong> Truy cập biểu tượng Giỏ hàng ở góc trên để tùy chỉnh số lượng hoặc xóa bớt mặt hàng.
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Thanh toán an toàn:</strong> Nhấn "Thanh toán", điền chính xác địa chỉ giao hàng và số điện thoại, sau đó chọn phương thức thanh toán chuyển khoản qua quét mã QR hoặc COD.
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Xác nhận:</strong> Hệ thống sẽ lưu trữ và tự động cập nhật trạng thái chuẩn bị sách cho bạn.
              </li>
            </ol>
          </div>
        );
      case 'refund':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Chính Sách Đổi Trả Sách</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Chúng tôi luôn mong muốn mang tới cho bạn những trang sách hoàn hảo nhất. Nếu phát hiện sai sót, chính sách đổi trả của chúng tôi sẽ hỗ trợ tối đa:
            </p>
            <ul className="list-disc list-inside space-y-3 text-xs text-stone-700">
              <li>
                <strong className="text-[#2C4A3B]">Thời hạn đổi trả:</strong> Trong vòng 7 ngày kể từ ngày nhận hàng thành công (dựa theo dấu bưu điện hoặc lịch trình của đơn vị vận chuyển).
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Điều kiện đổi trả sản phẩm:</strong> Sách chưa qua sử dụng, còn giữ nguyên tình trạng vật lý (không bị rách gáy, ẩm ướt, viết vẽ, bôi bẩn).
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Chi phí vận chuyển đổi trả:</strong> 
                <p className="pl-5 mt-1 text-stone-500 italic">
                  - Miễn phí 100% nếu lỗi từ nhà phát hành (in nhầm trang, mất chữ, rách bìa trước khi giao) hoặc đơn vị vận chuyển.
                </p>
                <p className="pl-5 text-stone-500 italic">
                  - Trường hợp khách hàng thay đổi ý định mua, vui lòng thanh toán phí vận chuyển hai chiều.
                </p>
              </li>
            </ul>
          </div>
        );
      case 'payment':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Phương Thức Thanh Toán</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pigeon Bookstore hỗ trợ nhiều phương thức linh hoạt giúp giao dịch của bạn nhanh chóng và bảo mật nhất:
            </p>
            <div className="space-y-3 text-xs text-stone-700">
              <div className="border border-stone-200 p-3 rounded-none bg-stone-50">
                <strong className="text-[#2C4A3B] block mb-1">🏦 Chuyển khoản ngân hàng qua mã QR (VietQR)</strong>
                Hệ thống tự động hiển thị mã QR kèm nội dung chuyển khoản được cấu hình sẵn chính xác. Bạn chỉ cần mở ứng dụng ngân hàng và quét mã để hoàn tất trong 3 giây.
              </div>
              <div className="border border-stone-200 p-3 rounded-none bg-stone-50">
                <strong className="text-[#2C4A3B] block mb-1">📦 Thanh toán khi nhận hàng (COD)</strong>
                Nhận sách, kiểm tra đóng gói rồi thanh toán tiền mặt trực tiếp cho nhân viên bưu tá giao hàng. Phương thức áp dụng trên toàn quốc.
              </div>
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Câu Hỏi Thường Gặp (FAQ)</h3>
            <div className="space-y-4 text-xs text-stone-700">
              <div>
                <strong className="text-[#2C4A3B] block mb-1">Q: Pigeon Bookstore có cam kết sách chính hãng không?</strong>
                <p className="text-stone-600">A: 100% sách tại Pigeon Bookstore đều là sách mới bản quyền chính văn từ các nhà xuất bản uy tín hàng đầu như Nhã Nam, Đông A, Kim Đồng, Trẻ.</p>
              </div>
              <div>
                <strong className="text-[#2C4A3B] block mb-1">Q: Thời gian giao hàng trung bình là bao lâu?</strong>
                <p className="text-stone-600">A: Khu vực nội thành Hà Nội giao từ 1 - 2 ngày. Các tỉnh thành khác giao từ 3 - 5 ngày làm việc.</p>
              </div>
              <div>
                <strong className="text-[#2C4A3B] block mb-1">Q: Tôi có thể hủy đơn hàng đã đặt không?</strong>
                <p className="text-stone-600">A: Có, quý khách vui lòng liên hệ ngay với hotline hỗ trợ trước khi đơn hàng chuyển trạng thái "Đang giao hàng" để được hoàn tiền nhanh nhất.</p>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Liên Hệ Với Chúng Tôi</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Mọi thắc mắc, đóng góp ý kiến hoặc phản ánh chất lượng dịch vụ, vui lòng liên hệ với đội ngũ Pigeon qua các kênh chính thức sau:
            </p>
            <div className="space-y-3 text-xs text-stone-700">
              <p>📞 <strong className="text-[#2C4A3B]">Hotline Chăm sóc khách hàng:</strong> 1900 6088 (8:00 - 21:00, tất cả các ngày trong tuần)</p>
              <p>✉️ <strong className="text-[#2C4A3B]">Email hỗ trợ:</strong> support@pigeonbookstore.vn</p>
              <p>📍 <strong className="text-[#2C4A3B]">Địa chỉ văn phòng & cửa hàng chính:</strong> 144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội</p>
              <p>💬 <strong className="text-[#2C4A3B]">Fanpage chính thức:</strong> fb.com/pigeonbookstore</p>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Chính Sách Bảo Mật</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tại Pigeon Bookstore, chúng tôi tôn trọng và đặt sự bảo mật thông tin cá nhân của khách hàng lên hàng đầu:
            </p>
            <ul className="list-disc list-inside space-y-3 text-xs text-stone-700">
              <li>
                <strong className="text-[#2C4A3B]">Thu thập thông tin:</strong> Chúng tôi chỉ thu thập thông tin cơ bản phục vụ cho việc tạo tài khoản, giao vận đơn hàng (Họ tên, Địa chỉ, Số điện thoại, Email).
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Bảo mật tuyệt đối:</strong> Mọi thông tin được mã hóa bằng chuẩn bảo mật SSL cao nhất. Chúng tôi cam kết không bán, trao đổi thông tin khách hàng cho bất cứ bên thứ ba nào ngoại trừ đối tác vận chuyển phục vụ đơn hàng.
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Quyền kiểm soát:</strong> Bạn có toàn quyền truy cập, thay đổi hoặc yêu cầu xóa tài khoản thông tin cá nhân trực tiếp trong phần Hồ sơ người dùng.
              </li>
            </ul>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Điều Khoản Dịch Vụ</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Bằng việc truy cập sử dụng website Pigeon Bookstore, quý khách hàng đồng ý tuân thủ các quy tắc sau:
            </p>
            <ul className="list-disc list-inside space-y-3 text-xs text-stone-700">
              <li>
                <strong className="text-[#2C4A3B]">Tài khoản:</strong> Khách hàng tự chịu trách nhiệm bảo mật mật khẩu tài khoản đã đăng ký cá nhân.
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Giao dịch lành mạnh:</strong> Cam kết cung cấp thông tin liên hệ và địa chỉ chính xác để quá trình giao nhận sách diễn ra thuận lợi.
              </li>
              <li>
                <strong className="text-[#2C4A3B]">Bản quyền:</strong> Toàn bộ hình ảnh, nội dung giới thiệu sách trên trang web thuộc quyền sở hữu trí tuệ của Pigeon Bookstore. Nghiêm cấm mọi hành vi sao chép phi pháp vì mục đích thương mại.
              </li>
            </ul>
          </div>
        );
      case 'cookie':
        return (
          <div className="space-y-4 font-sans text-left">
            <h3 className="font-serif text-xl font-bold text-stone-900 border-b pb-2">Chính Sách Cookie</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Chúng tôi sử dụng tệp tin Cookie nhỏ lưu trữ trên trình duyệt của bạn nhằm mục đích:
            </p>
            <ul className="list-disc list-inside space-y-3 text-xs text-stone-700">
              <li>Ghi nhớ trạng thái đăng nhập tài khoản và danh sách giỏ hàng tạm thời.</li>
              <li>Tối ưu hóa tốc độ tải trang dựa trên thói quen duyệt web của bạn.</li>
              <li>Gợi ý chính xác các cuốn sách nổi bật dựa theo lịch sử các đầu sách bạn từng tham khảo.</li>
            </ul>
            <p className="text-xs text-stone-500 italic mt-2">
              * Quý khách hoàn toàn có thể chủ động tắt tính năng thu thập Cookie trong mục cài đặt bảo mật của trình duyệt web bất cứ lúc nào.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Do not display Footer on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <footer className="w-full bg-[#111d17] border-t border-[#1a2f24] text-[#d4dcd7] py-16 px-6 relative font-sans select-none z-40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          
          {/* Column 1: Branding */}
          <div className="md:col-span-4 flex flex-col items-start text-left w-full border-b border-[#1a2f24] md:border-b-0 pb-6 md:pb-0">
            <h2 className="text-xl md:text-2xl font-serif text-white font-bold tracking-wide italic mb-4">
              Pigeon Bookstore
            </h2>
            <p className="text-xs text-[#a0b0a8] font-sans tracking-wide leading-relaxed mb-6 max-w-sm">
              Tuyển chọn những cuốn sách chạm đến trái tim — nơi tri thức gặp gỡ tâm hồn. Hãy cùng chúng tôi lan tỏa văn hóa đọc văn minh.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 border border-[#2a4537] hover:border-[#4d7d65] text-[#a0b0a8] hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer rounded-none bg-[#16271e]"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 border border-[#2a4537] hover:border-[#4d7d65] text-[#a0b0a8] hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer rounded-none bg-[#16271e]"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 border border-[#2a4537] hover:border-[#4d7d65] text-[#a0b0a8] hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer rounded-none bg-[#16271e]"
                aria-label="Tiktok"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31.01 2.61.02 3.91.03.07 1.54.8 2.98 2 3.86.01.88.02 1.76.03 2.64-1.24-.01-2.48-.48-3.41-1.32-.01 2.37-.02 4.74-.03 7.11-.08 3.51-3.23 6.13-6.72 5.66-2.61-.35-4.66-2.52-4.67-5.15.04-3.66 3.45-6.38 7.07-5.32V10c-1.57-.45-3.25.32-3.8 1.83-.55 1.51.13 3.24 1.56 3.94 1.43.7 3.26-.06 3.8-1.58.07-.19.1-.39.1-.59-.01-4.52-.01-9.04-.01-13.56v-.02z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: THỂ LOẠI */}
          <div className="md:col-span-2 flex flex-col items-start text-left md:pl-4 w-full border-b border-[#1a2f24] md:border-b-0 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#e8e4db] md:pointer-events-none mb-0 md:mb-5 cursor-pointer md:cursor-default py-2 md:py-0 bg-transparent border-0 text-left"
            >
              <span>Thể loại</span>
              <span className="md:hidden text-[#72857a] text-sm font-normal">
                {expandedSections.categories ? '−' : '+'}
              </span>
            </button>
            <div className={`flex flex-col gap-3 text-xs text-[#a0b0a8] font-sans mt-3 md:mt-0 overflow-hidden transition-all duration-300 w-full ${
              expandedSections.categories ? 'max-h-60 opacity-100' : 'max-h-0 md:max-h-none opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
            }`}>
              <button onClick={() => handleCategoryClick('Văn học')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Văn học
              </button>
              <button onClick={() => handleCategoryClick('Kiến thức')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Kiến thức
              </button>
              <button onClick={() => handleCategoryClick('Thiếu nhi')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Thiếu nhi
              </button>
              <button onClick={() => handleCategoryClick('Kỹ năng')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Kỹ năng sống
              </button>
              <button onClick={() => handleCategoryClick('Triết học')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Triết học
              </button>
              <button onClick={() => handleCategoryClick('Lịch sử')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Lịch sử
              </button>
            </div>
          </div>

          {/* Column 3: HỖ TRỢ */}
          <div className="md:col-span-2 flex flex-col items-start text-left md:pl-4 w-full border-b border-[#1a2f24] md:border-b-0 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('support')}
              className="w-full flex items-center justify-between text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#e8e4db] md:pointer-events-none mb-0 md:mb-5 cursor-pointer md:cursor-default py-2 md:py-0 bg-transparent border-0 text-left"
            >
              <span>Hỗ trợ</span>
              <span className="md:hidden text-[#72857a] text-sm font-normal">
                {expandedSections.support ? '−' : '+'}
              </span>
            </button>
            <div className={`flex flex-col gap-3 text-xs text-[#a0b0a8] font-sans mt-3 md:mt-0 overflow-hidden transition-all duration-300 w-full ${
              expandedSections.support ? 'max-h-60 opacity-100' : 'max-h-0 md:max-h-none opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
            }`}>
              <button onClick={() => openSupport('order_guide')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Cách đặt hàng
              </button>
              <button onClick={() => openSupport('refund')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Đổi trả hàng
              </button>
              <button onClick={() => openSupport('payment')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Thanh toán
              </button>
              <button onClick={() => openSupport('faq')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Theo dõi đơn
              </button>
              <button onClick={() => openSupport('faq')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                FAQ
              </button>
              <button onClick={() => openSupport('contact')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-sans">
                Liên hệ
              </button>
            </div>
          </div>

          {/* Column 4: TÀI KHOẢN */}
          <div className="md:col-span-4 flex flex-col items-start text-left md:pl-4 w-full border-b border-[#1a2f24] md:border-b-0 pb-4 md:pb-0">
            <button
              onClick={() => toggleSection('account')}
              className="w-full flex items-center justify-between text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#e8e4db] md:pointer-events-none mb-0 md:mb-5 cursor-pointer md:cursor-default py-2 md:py-0 bg-transparent border-0 text-left"
            >
              <span>Tài khoản</span>
              <span className="md:hidden text-[#72857a] text-sm font-normal">
                {expandedSections.account ? '−' : '+'}
              </span>
            </button>
            <div className={`flex flex-col gap-3 text-xs text-[#a0b0a8] font-sans mt-3 md:mt-0 overflow-hidden transition-all duration-300 w-full ${
              expandedSections.account ? 'max-h-60 opacity-100' : 'max-h-0 md:max-h-none opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto'
            }`}>
              <Link to="/login" className="hover:text-white transition-colors">
                Đăng nhập
              </Link>
              <Link to="/register" className="hover:text-white transition-colors">
                Đăng ký
              </Link>
              <Link to="/orders" className="hover:text-white transition-colors">
                Đơn hàng của tôi
              </Link>
              <Link to="/wishlist" className="hover:text-white transition-colors">
                Danh sách yêu thích
              </Link>
              <Link to="/profile" className="hover:text-white transition-colors">
                Địa chỉ giao hàng
              </Link>
            </div>
          </div>


        </div>

        {/* Horizontal separator */}
        <div className="max-w-6xl mx-auto border-t border-[#1a2f24] mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left copyright */}
          <p className="text-[10px] font-sans tracking-widest text-[#72857a]">
            © 2026 Pigeon Bookstore. Bảo lưu mọi quyền.
          </p>

          {/* Right Policies & Scroll to top */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-sans font-bold tracking-wider text-[#a0b0a8]">
            <button onClick={() => openSupport('privacy')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer font-sans uppercase">
              Chính sách bảo mật
            </button>
            <button onClick={() => openSupport('terms')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer font-sans uppercase">
              Điều khoản dịch vụ
            </button>
            <button onClick={() => openSupport('cookie')} className="hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer font-sans uppercase">
              Cookie
            </button>
            
            {/* Elegant Scroll to top button */}
            <button
              onClick={scrollToTop}
              className="w-8 h-8 border border-[#2a4537] hover:border-[#4d7d65] text-[#a0b0a8] hover:text-white transition-all flex items-center justify-center rounded-none bg-[#16271e] cursor-pointer hover:-translate-y-0.5"
              title="Cuộn lên đầu trang"
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </footer>

      {/* Support & Policy Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-fadeIn">
          {/* Modal Container */}
          <div className="bg-white border border-[#2C4A3B]/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-3xl h-[90vh] md:h-[480px] max-h-[90vh] md:max-h-none flex flex-col relative animate-slideUp">
            
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-800 transition-colors bg-transparent border-0 cursor-pointer z-10"
              title="Đóng cửa sổ"
            >
              <X size={20} />
            </button>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
              
              {/* Sidebar Tabs */}
              <div className="w-full md:w-1/3 bg-[#faf8f5] border-b md:border-b-0 md:border-r border-stone-200 py-4 md:py-6 px-4 flex flex-row overflow-x-auto md:flex-col md:overflow-y-auto gap-1.5 flex-shrink-0 hide-scrollbar">
                <div className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#2C4A3B] px-3 mb-0 md:mb-4 whitespace-nowrap self-center md:self-auto hidden md:block">
                  Trung tâm hỗ trợ
                </div>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-auto md:w-full flex items-center gap-2.5 px-4 py-2.5 md:py-3 text-xs font-sans font-bold uppercase tracking-wider transition-all text-left border-0 cursor-pointer flex-shrink-0 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#2C4A3B] text-white'
                        : 'bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Rich Content Viewport */}
              <div className="w-full md:w-2/3 p-4 md:p-8 overflow-y-visible md:overflow-y-auto bg-white flex flex-col justify-between flex-grow">
                {renderTabContent()}
                
                {/* Modal Footer */}
                <div className="border-t border-stone-100 pt-4 mt-6 flex justify-between items-center text-[10px] font-sans text-stone-400">
                  <span>Pigeon Bookstore © 2026</span>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white px-4 py-1.5 text-[9px] uppercase tracking-wider font-bold transition-colors border-0 cursor-pointer"
                  >
                    Đồng ý và Đóng
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
