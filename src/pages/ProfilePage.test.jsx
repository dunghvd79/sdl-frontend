import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from '../services/api';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import ProfilePage from './ProfilePage';

const PROFILE = {
  id: 7, email: 'khach@gmail.com', full_name: 'Khách', phone: '', address: '',
  role: 'CUSTOMER', is_active: true, created_at: '2026-11-17T00:00:00Z',
};

function renderProfile(profile) {
  api.get.mockResolvedValue({ data: { data: profile } });
  return render(
    <ToastProvider>
      <AuthProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  localStorage.setItem('token', 'tok');
  localStorage.setItem('user', JSON.stringify({ id: 7, email: 'khach@gmail.com', role: 'CUSTOMER' }));
});

describe('ProfilePage — đổi mật khẩu (spec 005)', () => {
  it('tài khoản chỉ dùng Google (has_password false) → hướng dẫn tạo mật khẩu, không có form đòi mật khẩu hiện tại', async () => {
    renderProfile({ ...PROFILE, has_password: false });

    expect(await screen.findByText(/Tài khoản của bạn hiện chưa có mật khẩu/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tạo mật khẩu' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.queryByLabelText('Mật khẩu hiện tại')).toBeNull();
  });

  it('tài khoản có mật khẩu → form đổi mật khẩu như cũ', async () => {
    renderProfile({ ...PROFILE, has_password: true });

    expect(await screen.findByLabelText('Mật khẩu hiện tại')).toBeInTheDocument();
    expect(screen.queryByText(/Tài khoản của bạn hiện chưa có mật khẩu/)).toBeNull();
  });
});
