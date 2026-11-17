import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: null } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from '../services/api';
import { AuthProvider } from '../context/AuthContext';
import ResetPasswordPage from './ResetPasswordPage';

function renderPage(url = '/reset-password?token=abc123') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<p>Trang quên mật khẩu</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

async function submitNewPassword(user) {
  await user.type(screen.getByLabelText('Mật khẩu mới'), 'matkhau123');
  await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'matkhau123');
  await user.click(screen.getByRole('button', { name: 'Xác nhận thay đổi' }));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { data: null } });
  api.post.mockResolvedValue({ data: {} });
});

describe('ResetPasswordPage', () => {
  it('B62: đặt lại thành công thì xoá phiên đang có trên trình duyệt (kể cả tài khoản khác)', async () => {
    // Trình duyệt đang đăng nhập Admin, đặt lại mật khẩu cho tài khoản khách
    localStorage.setItem('token', 'admin-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'admin@x.vn', role: 'ADMIN' }));
    api.post.mockImplementation((url) =>
      Promise.resolve({ data: url === '/auth/reset-password' ? { message: 'Đặt lại mật khẩu thành công!' } : {} })
    );
    const user = userEvent.setup();
    renderPage();

    await submitNewPassword(user);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/logout'));
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'abc123', newPassword: 'matkhau123' });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('chưa đăng nhập thì không gọi /auth/logout', async () => {
    const user = userEvent.setup();
    renderPage();

    await submitNewPassword(user);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/reset-password', expect.anything()));
    expect(api.post).not.toHaveBeenCalledWith('/auth/logout');
  });

  it('mã không hợp lệ / hết hạn: gợi ý dùng email mới nhất và có lối yêu cầu email mới', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn!' } },
    });
    const user = userEvent.setup();
    renderPage();

    await submitNewPassword(user);

    expect(await screen.findByText(/email khôi phục mới nhất/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Yêu cầu email mới' }));
    expect(screen.getByText('Trang quên mật khẩu')).toBeInTheDocument();
  });
});
