import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || '✅ Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư!');
    } catch (err) {
      setError(err.response?.data?.error || '❌ Gửi yêu cầu thất bại. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="bg-white p-8 md:p-10 border border-divider rounded-none w-full max-w-md">
        <h2 className="text-3xl font-serif text-center uppercase tracking-widest text-ink mb-4">
          Quên Mật Khẩu
        </h2>
        <p className="text-xs text-ink/70 text-center tracking-wider mb-8 leading-relaxed">
          Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi cho bạn một liên kết khôi phục mật khẩu.
        </p>

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
              Email của bạn
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-divider bg-transparent rounded-none px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
              placeholder="ten-dang-nhap@domain.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] text-white font-sans text-xs font-bold py-3 uppercase tracking-[0.2em] transition-colors rounded-none disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Đang xử lý...' : 'Gửi yêu cầu'}
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
