import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, login, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // State cập nhật thông tin cá nhân
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // State đổi mật khẩu
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        setProfile(response.data.data);
        setFullName(response.data.data.full_name || '');
        setPhone(response.data.data.phone || '');
        setAddress(response.data.data.address || '');
      } catch (err) {
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, toast]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.warning('Họ tên không được để trống');
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      const response = await api.put('/users/profile', {
        full_name: fullName,
        phone: phone ? phone.trim() : '',
        address: address ? address.trim() : ''
      });
      setProfile(response.data.data);
      // Cập nhật state toàn cục để Navbar thay đổi ngay lập tức
      updateUser({
        full_name: fullName,
        fullName: fullName,
        phone: phone ? phone.trim() : '',
        address: address ? address.trim() : ''
      });
      toast.success('Đã cập nhật thông tin thành công');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi cập nhật thông tin');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.warning('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwords.new.length < 6) {
      toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success('Đã đổi mật khẩu thành công!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi đổi mật khẩu');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2C4A3B] border-t-transparent"></div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = (profile.full_name || profile.email || 'U').substring(0, 2).toUpperCase();

  const roleColor = {
    ADMIN: 'border border-red-200 text-red-700 bg-red-50/50 rounded-full',
    CURATOR: 'border border-purple-200 text-purple-700 bg-purple-50/50 rounded-full',
    CUSTOMER: 'border border-divider text-ink-light bg-[#f0ece7] rounded-full'
  }[profile.role] || 'border border-divider text-ink-light bg-[#f0ece7] rounded-full';

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 w-full flex-grow">
      {/* Header & Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-divider pb-6 mb-10">
        <div>
          <h1 className="text-3xl font-serif font-medium text-ink tracking-wide uppercase">Tài khoản của tôi</h1>
          <p className="text-ink-light text-xs mt-2 max-w-xl font-sans tracking-wide leading-relaxed">
            Quản lý thông tin định danh cá nhân, cập nhật mật khẩu bảo mật và thông tin thành viên Pigeon Bookstore.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-0 border border-divider shrink-0 w-full sm:w-auto">
          <Link
            to="/profile"
            className="flex-1 sm:flex-initial px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 bg-ink text-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Hồ sơ cá nhân
          </Link>
          <Link
            to="/orders"
            className="flex-1 sm:flex-initial px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 border-l border-divider bg-white text-ink-light hover:text-ink hover:bg-surface-warm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Đơn hàng của tôi
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Overview */}
        <div className="col-span-1">
          <div className="bg-white rounded-none border border-divider p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#f0ece7] border border-divider flex items-center justify-center mb-4 font-serif text-3xl font-medium text-[#2C4A3B]">
              {initials}
            </div>
            <h2 className="text-lg font-serif font-semibold text-ink line-clamp-1 mb-1">{profile.full_name}</h2>
            <p className="text-ink-light text-sm mb-4">{profile.email}</p>
            <div className={`px-4 py-1 text-xs font-medium border ${roleColor}`}>
              {profile.role}
            </div>
            <div className="mt-8 pt-6 border-t border-divider w-full text-xs text-ink-light">
              Đăng ký từ: {new Date(profile.created_at).toLocaleDateString('vi-VN')}
            </div>
            {/* Quick link to Orders */}
            <Link
              to="/orders"
              className="mt-4 w-full flex items-center justify-center gap-2 border border-divider hover:border-[#2C4A3B] hover:text-[#2C4A3B] text-ink-light py-2 rounded-none transition-colors text-[11px] font-bold uppercase tracking-wider group"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Đơn hàng của tôi
            </Link>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="col-span-1 md:col-span-2 space-y-8">
          
          {/* Card 1: Cập nhật thông tin */}
          <div className="bg-white rounded-none border border-divider">
            <div className="px-8 py-4 border-b border-divider bg-surface-warm">
              <h3 className="font-serif font-medium text-ink">Thông tin cá nhân</h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-medium">Email (Đăng nhập)</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full border border-divider rounded-none px-4 py-2.5 text-sm bg-surface-warm text-ink-light cursor-not-allowed"
                  />
                  <p className="text-xs text-ink-light mt-1.5 italic">Email không thể thay đổi.</p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-medium">Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-medium">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink"
                    placeholder="VD: 0987654321"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-medium">Địa chỉ mặc định</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink min-h-[85px] resize-none"
                    placeholder="VD: Số 1 Đại Cồ Việt, Hai Bàng Trưng, Hà Nội"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile || !fullName.trim()}
                  className="bg-[#2C4A3B] hover:bg-[#1e3529] disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-none transition-colors text-sm uppercase tracking-wider"
                >
                  {isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Đổi mật khẩu */}
          <div className="bg-white rounded-none border border-divider">
            <div className="px-8 py-4 border-b border-divider bg-surface-warm">
              <h3 className="font-serif font-medium text-ink">Đổi mật khẩu</h3>
            </div>
            <form onSubmit={handleChangePassword} className="p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-medium">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-medium">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full border border-divider rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-ink-light mb-1.5 font-medium">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className={`w-full border rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink ${
                        passwords.confirm && passwords.new !== passwords.confirm
                          ? 'border-red-500'
                          : 'border-divider'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !passwords.current || !passwords.new || !passwords.confirm}
                  className="bg-ink hover:bg-ink-light disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-none transition-colors text-sm uppercase tracking-wider"
                >
                  {isUpdatingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
