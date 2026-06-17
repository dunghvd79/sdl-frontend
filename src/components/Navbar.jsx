import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Search, Heart, ShoppingCart, Gift, Settings, Bell, Menu, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import pigeonImg from '../../picture/bo_Cau.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleScrollToSection = (elementId) => {
    if (location.pathname === '/') {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: elementId } });
    }
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    if (!mobileSearchQuery.trim()) return;
    setIsMobileMenuOpen(false);
    navigate(`/?search=${encodeURIComponent(mobileSearchQuery.trim())}`, { state: { scrollTo: 'explore' } });
    setMobileSearchQuery('');
  };

  const handleNavbarSearchClick = () => {
    if (location.pathname === '/') {
      const element = document.getElementById('explore');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      const searchInput = document.getElementById('homepage-search-input');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 150);
      }
    } else {
      navigate('/', { state: { focusSearch: true } });
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const queryClient = useQueryClient();

  const { data: notificationsData } = useQuery({
    queryKey: ['myNotifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    enabled: !!user,
    refetchInterval: 15000
  });

  // Fetch wishlist to get the count of liked books
  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => api.get('/wishlists').then(r => r.data.data),
    enabled: !!user
  });

  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['myNotifications']);
    }
  });

  const notifications = notificationsData || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notif) => {
    setBellOpen(false);
    if (!notif.is_read) {
      try {
        await api.put(`/notifications/${notif.id}/read`);
        queryClient.invalidateQueries(['myNotifications']);
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.type === 'ORDER') {
      navigate('/orders');
    } else {
      navigate('/profile');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const userName = user ? (user.fullName || user.email?.split('@')[0]) : '';

  return (
    <>
      {/* Top Banner (Scrolls away) */}
      <div className="w-full bg-[#e8e4db] text-stone-700 border-b border-[#d4d2cb] text-[10px] md:text-xs font-medium tracking-wide flex flex-col md:flex-row items-center justify-center py-2 px-4 text-center gap-2 md:gap-4 font-sans relative z-50">
        <span>Chào mừng bạn đến với Pigeon Bookstore. Miễn phí giao hàng toàn quốc cho đơn từ 200.000đ.</span>
        <Link to={user ? "/promotions" : "/register"} className="inline-flex items-center gap-1.5 bg-[#2C4A3B] hover:bg-[#1e3529] text-white px-3 py-1 rounded-none transition-colors font-bold tracking-wider uppercase text-[9px] md:text-[10px]">
          <Gift size={12} strokeWidth={2.5} />
          Nhận ưu đãi ngay
        </Link>
      </div>

      {/* Sticky Container cho Navbar và Slogan */}
      <header className="sticky top-0 z-50 w-full flex flex-col font-sans border-b border-divider transition-all duration-300">
        {/* Main Navbar */}
        <nav className="w-full px-6 py-3 flex items-center justify-between relative bg-beige">

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex lg:hidden text-ink-60 hover:text-ink transition-colors cursor-pointer bg-transparent border-none p-1 -ml-2"
            title="Mở menu"
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          {/* Left Menu */}
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-60">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-ink transition-colors text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
            >
              Trang chủ
            </Link>
            <button
              onClick={() => handleScrollToSection('explore')}
              className="hover:text-ink transition-colors bg-transparent border-none p-0 cursor-pointer text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
            >
              Danh mục
            </button>
            <Link
              to="/blog"
              className="hover:text-ink transition-colors text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
            >
              Bài viết
            </Link>
            <button
              onClick={() => handleScrollToSection('about')}
              className="hover:text-ink transition-colors bg-transparent border-none p-0 cursor-pointer text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-900"
            >
              Về chúng tôi
            </button>
          </div>

          {/* Center Logo */}
          <Link to="/" className="text-base sm:text-2xl md:text-3xl font-serif text-ink lg:absolute lg:left-1/2 lg:-translate-x-1/2 whitespace-nowrap flex items-center justify-center gap-2 md:gap-3">
            <img src={pigeonImg} alt="Pigeon Left" className="w-8 h-8 md:w-10 md:h-10 object-contain opacity-85 -scale-x-100 hidden sm:block" />
            <span className="italic uppercase tracking-wide">Pigeon Bookstore</span>
            <img src={pigeonImg} alt="Pigeon Right" className="w-8 h-8 md:w-10 md:h-10 object-contain opacity-85 hidden sm:block" />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-5 text-ink-60">
            <button 
              onClick={handleNavbarSearchClick}
              className="hover:text-ink transition-colors hidden sm:block cursor-pointer bg-transparent border-none p-1"
              title="Tìm kiếm sách"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            <Link 
              to="/promotions" 
              className="relative hover:text-ink transition-colors hidden sm:block cursor-pointer p-1" 
              title="Trạm khuyến mãi"
            >
              <Gift size={20} strokeWidth={1.5} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#2C4A3B] rounded-full border border-white animate-pulse" />
            </Link>

            <Link to="/wishlist" className="relative hover:text-ink transition-colors hidden sm:block cursor-pointer" title="Danh sách yêu thích">
              <Heart size={20} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2C4A3B] text-white text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Notification Bell Dropdown */}
            {user && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen(!bellOpen)}
                  className="hover:text-ink transition-colors hidden sm:block cursor-pointer relative"
                  title="Thông báo"
                >
                  <Bell size={20} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#2C4A3B] text-white text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                <div className={`absolute right-0 top-full mt-2 w-72 bg-white border border-divider shadow-md rounded-none transition-all duration-150 z-50 ${
                  bellOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  {/* Arrow pointer */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-l border-t border-divider rotate-45"></div>

                  <div className="py-1">
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-divider flex justify-between items-center bg-[#faf8f5]">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-ink">Thông báo</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          disabled={markAllReadMutation.isPending}
                          className="text-[9px] uppercase tracking-wider text-[#2C4A3B] hover:underline font-bold bg-transparent border-0 cursor-pointer"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-divider-lt">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left p-3.5 flex gap-3 hover:bg-surface-warm transition-colors relative border-0 cursor-pointer ${
                              !notif.is_read ? 'bg-[#faf8f5]' : 'bg-white'
                            }`}
                          >
                            {/* Unread dot */}
                            {!notif.is_read && (
                              <span className="absolute top-4 left-1.5 w-1.5 h-1.5 bg-[#2C4A3B] rounded-full" />
                            )}
                            
                            {/* Icon Indicator */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                              notif.type === 'ORDER'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-[#faf8f5] text-ink border border-divider'
                            }`}>
                              {notif.type === 'ORDER' ? '📦' : '📢'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold text-ink leading-tight truncate ${!notif.is_read ? 'font-bold' : ''}`}>
                                {notif.title}
                              </p>
                              <p className="text-[10px] text-ink-light leading-snug line-clamp-2 mt-1">
                                {notif.content}
                              </p>
                              <span className="text-[8px] text-ink-light/50 font-mono mt-1 block">
                                {new Date(notif.created_at).toLocaleDateString('vi-VN')} {new Date(notif.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-ink-light text-xs italic">
                          Chưa có thông báo nào.
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2.5 border-t border-divider text-center bg-[#faf8f5]">
                      <Link
                        to="/notifications"
                        onClick={() => setBellOpen(false)}
                        className="text-[10px] uppercase tracking-wider font-bold text-ink-light hover:text-[#2C4A3B] transition-colors"
                      >
                        Xem tất cả thông báo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Link to="/cart" className="relative hover:text-ink transition-colors sm:mr-2">
              <ShoppingCart size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#2C4A3B] text-white text-[9px] font-mono font-bold w-4 h-4 flex items-center justify-center rounded-none">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                {/* User Dropdown */}
                <div className="relative group" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-divider hover:border-ink hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full border border-divider-lt flex items-center justify-center overflow-hidden p-0.5 bg-surface-subtle">
                      <img src="https://cdn-icons-png.flaticon.com/512/3069/3069172.png" alt="Avatar" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-xs text-ink-60 group-hover:text-ink transition-colors max-w-[100px] truncate">
                      {userName}
                    </span>
                    <span className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-full border border-divider-lt text-ink-60 uppercase tracking-widest bg-[#f0ece7]">
                      {user.role}
                    </span>
                    {/* Chevron down */}
                    <svg className={`w-3 h-3 text-ink-light group-hover:text-ink transition-all duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 top-full mt-2 w-52 bg-white border border-divider shadow-md rounded-none transition-all duration-150 z-50 ${
                    dropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}>
                    {/* Arrow pointer */}
                    <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-l border-t border-divider rotate-45"></div>

                    <div className="py-1">
                      {/* Header label */}
                      <div className="px-4 py-2 border-b border-divider">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-ink-light">Tài khoản của tôi</p>
                      </div>

                      {/* Trang quản trị (Chỉ dành cho ADMIN / CURATOR) */}
                      {(user.role === 'ADMIN' || user.role === 'CURATOR') && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-warm transition-colors group/item border-b border-divider-lt"
                        >
                          <div className="w-7 h-7 border border-divider flex items-center justify-center text-ink-light group-hover/item:border-[#2C4A3B] group-hover/item:text-[#2C4A3B] transition-colors bg-[#2C4A3B]/5">
                            <Settings size={14} className="group-hover/item:rotate-45 transition-transform duration-300" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#2C4A3B] group-hover/item:text-[#1e3529] transition-colors">Trang quản trị</p>
                            <p className="text-[10px] text-ink-light">Quản lý sách & đơn hàng</p>
                          </div>
                        </Link>
                      )}

                      {/* Hồ sơ */}
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-warm transition-colors group/item"
                      >
                        <div className="w-7 h-7 border border-divider flex items-center justify-center text-ink-light group-hover/item:border-[#2C4A3B] group-hover/item:text-[#2C4A3B] transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink group-hover/item:text-[#2C4A3B] transition-colors">Hồ sơ cá nhân</p>
                          <p className="text-[10px] text-ink-light">Thông tin & mật khẩu</p>
                        </div>
                      </Link>

                      {/* Đơn hàng của tôi */}
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-warm transition-colors group/item"
                      >
                        <div className="w-7 h-7 border border-divider flex items-center justify-center text-ink-light group-hover/item:border-[#2C4A3B] group-hover/item:text-[#2C4A3B] transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink group-hover/item:text-[#2C4A3B] transition-colors">Đơn hàng của tôi</p>
                          <p className="text-[10px] text-ink-light">Lịch sử & theo dõi đơn</p>
                        </div>
                      </Link>

                      {/* Tủ sách của tôi */}
                      <Link
                        to="/shelf"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-warm transition-colors group/item"
                      >
                        <div className="w-7 h-7 border border-divider flex items-center justify-center text-ink-light group-hover/item:border-[#2C4A3B] group-hover/item:text-[#2C4A3B] transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink group-hover/item:text-[#2C4A3B] transition-colors">Tủ sách của tôi</p>
                          <p className="text-[10px] text-ink-light">Đọc sách & Tư vấn AI</p>
                        </div>
                      </Link>

                      {/* Divider */}
                      <div className="border-t border-divider my-1" />

                      {/* Đăng xuất */}
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors group/item text-left"
                      >
                        <div className="w-7 h-7 border border-divider flex items-center justify-center text-ink-light group-hover/item:border-red-300 group-hover/item:text-red-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink group-hover/item:text-red-600 transition-colors">Đăng xuất</p>
                          <p className="text-[10px] text-ink-light">Thoát khỏi tài khoản</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Admin / Curator Link */}
                {(user.role === 'ADMIN' || user.role === 'CURATOR') && (
                  <Link to="/admin" title="Trang Quản Trị" className="text-ink-60 hover:text-[#2C4A3B] transition-colors hidden sm:block">
                    <Settings size={20} strokeWidth={1.5} className="hover:rotate-90 transition-transform duration-300" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link to="/login" className="text-xs font-sans font-bold uppercase tracking-widest hover:text-ink transition-colors">
                  Đăng Nhập
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Slogan Banner */}
        <div className="w-full py-2 bg-white flex justify-center items-center">
          <p className="font-serif italic text-ink-60 text-xs md:text-sm tracking-widest uppercase text-center w-full">
            "Khơi nguồn tri thức, chắp cánh tương lai"
          </p>
        </div>
      </header>

      {/* Mobile Drawer (Menu trượt di động) */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div 
          className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[340px] bg-[#faf8f5] z-[101] p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out border-r border-divider overflow-y-auto ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Drawer Section */}
          <div className="space-y-6">
            
            {/* Header / Logo */}
            <div className="flex items-center justify-between pb-4 border-b border-divider">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-serif font-bold text-ink flex items-center gap-2"
              >
                <img src={pigeonImg} alt="Logo" className="w-6 h-6 object-contain" />
                <span className="italic uppercase">Pigeon Book</span>
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-stone-400 hover:text-ink transition-colors cursor-pointer bg-transparent border-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Search Bar */}
            <form onSubmit={handleMobileSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Tìm sách, tác giả..."
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                className="w-full border border-stone-200 bg-white rounded-none py-2 pl-9 pr-4 text-xs font-sans focus:outline-none focus:border-[#2C4A3B] text-ink placeholder:text-stone-400"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            </form>

            {/* Nav Links */}
            <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-[0.15em] text-stone-500">
              <Link 
                to="/" 
                onClick={() => { setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-stone-900 transition-colors py-1.5 border-b border-stone-200/50"
              >
                Trang chủ
              </Link>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); handleScrollToSection('explore'); }}
                className="text-left hover:text-stone-900 transition-colors py-1.5 border-b border-stone-200/50 bg-transparent border-none p-0 cursor-pointer uppercase font-bold text-stone-500 tracking-[0.15em]"
              >
                Danh mục sách
              </button>
              <Link 
                to="/blog" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-stone-900 transition-colors py-1.5 border-b border-stone-200/50"
              >
                Bài viết
              </Link>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); handleScrollToSection('about'); }}
                className="text-left hover:text-stone-900 transition-colors py-1.5 border-b border-stone-200/50 bg-transparent border-none p-0 cursor-pointer uppercase font-bold text-stone-500 tracking-[0.15em]"
              >
                Về chúng tôi
              </button>
            </div>

            {/* Quick Actions (Wishlist, Promotions, Notifications) */}
            <div className="pt-2 flex flex-col gap-3.5">
              <Link 
                to="/wishlist" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                <div className="flex items-center gap-2.5">
                  <Heart size={16} className="text-stone-500" />
                  <span>Sách yêu thích</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="bg-[#2C4A3B] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link 
                to="/promotions" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                <Gift size={16} className="text-stone-500" />
                <span>Trạm khuyến mãi</span>
              </Link>

              {user && (
                <Link 
                  to="/notifications" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell size={16} className="text-stone-500" />
                    <span>Thông báo</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-[#2C4A3B] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
            </div>

          </div>

          {/* Bottom Drawer Section (Account info) */}
          <div className="pt-6 border-t border-divider">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-divider flex items-center justify-center overflow-hidden p-0.5 bg-stone-100">
                    <img src="https://cdn-icons-png.flaticon.com/512/3069/3069172.png" alt="Avatar" className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">{userName}</p>
                    <span className="inline-block text-[8px] font-mono font-bold px-1.5 py-0.2 bg-stone-200 border border-stone-300 text-stone-600 uppercase tracking-widest">
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-divider pt-4 mt-2">
                  {/* Trang quản trị (Chỉ dành cho ADMIN / CURATOR) */}
                  {(user.role === 'ADMIN' || user.role === 'CURATOR') && (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 hover:bg-surface-warm transition-colors group/item border border-divider-lt bg-[#2C4A3B]/5"
                    >
                      <div className="w-6 h-6 border border-divider flex items-center justify-center text-[#2C4A3B] transition-colors bg-white">
                        <Settings size={12} className="group-hover/item:rotate-45 transition-transform duration-300" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-bold text-[#2C4A3B]">Trang quản trị</p>
                        <p className="text-[9px] text-[#2C4A3B]/70">Quản lý sách & đơn hàng</p>
                      </div>
                    </Link>
                  )}

                  {/* Hồ sơ */}
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 hover:bg-surface-warm transition-colors group/item border border-divider-lt bg-white"
                  >
                    <div className="w-6 h-6 border border-divider flex items-center justify-center text-stone-500 transition-colors bg-stone-50">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-stone-850 group-hover/item:text-[#2C4A3B] transition-colors">Hồ sơ cá nhân</p>
                      <p className="text-[9px] text-stone-500">Thông tin & mật khẩu</p>
                    </div>
                  </Link>

                  {/* Đơn hàng của tôi */}
                  <Link
                    to="/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 hover:bg-surface-warm transition-colors group/item border border-divider-lt bg-white"
                  >
                    <div className="w-6 h-6 border border-divider flex items-center justify-center text-stone-500 transition-colors bg-stone-50">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-stone-850 group-hover/item:text-[#2C4A3B] transition-colors">Đơn hàng của tôi</p>
                      <p className="text-[9px] text-stone-500">Lịch sử & theo dõi đơn</p>
                    </div>
                  </Link>

                  {/* Tủ sách của tôi */}
                  <Link
                    to="/shelf"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 hover:bg-surface-warm transition-colors group/item border border-[#2C4A3B]/20 bg-[#2C4A3B]/5"
                  >
                    <div className="w-6 h-6 border border-[#2C4A3B]/30 flex items-center justify-center text-[#2C4A3B] transition-colors bg-white">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-[#2C4A3B] group-hover/item:text-[#1e3529] transition-colors">Tủ sách của tôi</p>
                      <p className="text-[9px] text-stone-500">Đọc sách & Tư vấn AI</p>
                    </div>
                  </Link>
                </div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full border border-red-200 hover:bg-red-50 text-red-600 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest cursor-pointer bg-white"
                >
                  Đăng xuất tài khoản
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full bg-[#2C4A3B] hover:bg-[#1e3529] text-white py-2.5 text-center text-[10px] font-bold uppercase tracking-widest"
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full border border-divider hover:bg-stone-50 text-stone-700 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest bg-white"
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}