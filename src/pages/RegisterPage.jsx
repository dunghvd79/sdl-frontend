import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('❌ Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        password,
        fullName,
      });

      await login(email, password);
      
      toast.success('Đăng ký tài khoản thành công!', { title: 'Tuyệt vời 🎉' });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '❌ Đăng ký thất bại. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-16 px-4 flex-grow w-full">
      <div className="bg-white p-8 md:p-10 border border-divider rounded-none w-full max-w-md">
        <h2 className="text-3xl font-serif text-center uppercase tracking-widest text-ink mb-8">
          Đăng Ký
        </h2>

        {error && (
          <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-3 mb-6 text-xs rounded-none">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-sans font-bold tracking-widest text-ink/70 uppercase mb-2">
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-divider bg-transparent rounded-none px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans font-bold tracking-widest text-ink/70 uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-divider bg-transparent rounded-none px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
              placeholder="vi-du@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans font-bold tracking-widest text-ink/70 uppercase mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-divider bg-transparent rounded-none px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-sans font-bold tracking-widest text-ink/70 uppercase mb-2">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-divider bg-transparent rounded-none px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] text-white font-sans text-xs font-bold py-3 uppercase tracking-[0.2em] transition-colors rounded-none disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Đang khởi tạo tài khoản...' : 'Đăng Ký'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-ink-60 tracking-wider">
          Đã có tài khoản?{' '}
          <Link 
            to="/login" 
            className="text-ink font-semibold hover:text-[#2C4A3B] underline underline-offset-4 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}