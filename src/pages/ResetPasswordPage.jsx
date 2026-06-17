import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Client-side validations
    if (!token) {
      setError('❌ Không tìm thấy mã xác thực khôi phục mật khẩu. Vui lòng kiểm tra lại liên kết trong email của bạn.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('❌ Mật khẩu xác nhận không khớp. Vui lòng nhập lại!');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('❌ Mật khẩu phải chứa ít nhất 6 ký tự!');
      setLoading(false);
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setError('❌ Mật khẩu phải bao gồm cả chữ cái và chữ số!');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      setMessage(response.data.message || '✅ Đặt lại mật khẩu thành công! Bạn đang được chuyển hướng về trang đăng nhập...');
      
      // Chuyển hướng sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || '❌ Đặt lại mật khẩu thất bại. Liên kết có thể đã hết hạn hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="bg-white p-8 md:p-10 border border-divider rounded-none w-full max-w-md">
        <h2 className="text-3xl font-serif text-center uppercase tracking-widest text-ink mb-4">
          Đặt Lại Mật Khẩu
        </h2>
        <p className="text-xs text-ink/70 text-center tracking-wider mb-8 leading-relaxed">
          Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.
        </p>

        {!token && (
          <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-3 mb-6 text-xs rounded-none leading-relaxed">
            ⚠️ Thiếu token xác thực. Hãy đảm bảo bạn truy cập trang này từ liên kết được cung cấp trong email khôi phục mật khẩu.
          </div>
        )}

        {message && (
          <div className="bg-[#EBF3EE] border-l-2 border-[#1A3026] text-[#1A3026] p-3 mb-6 text-xs rounded-none leading-relaxed">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-3 mb-6 text-xs rounded-none leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-sans font-bold tracking-widest text-ink/70 uppercase mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-divider bg-transparent rounded-none px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
              placeholder="Tối thiểu 6 ký tự (gồm chữ và số)"
              required
              disabled={!token}
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans font-bold tracking-widest text-ink/70 uppercase mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-divider bg-transparent rounded-none px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
              placeholder="Nhập lại mật khẩu mới"
              required
              disabled={!token}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] text-white font-sans text-xs font-bold py-3 uppercase tracking-[0.2em] transition-colors rounded-none disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Đang lưu mật khẩu...' : 'Xác nhận thay đổi'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-ink-60 tracking-wider">
          <Link
            to="/login"
            className="text-ink font-semibold hover:text-[#2C4A3B] underline underline-offset-4 transition-colors"
          >
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
