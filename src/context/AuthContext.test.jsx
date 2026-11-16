import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock axios instance used by AuthContext. All methods return resolved promises
// by default so the mount-time /users/profile sync does not throw.
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: null } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from '../services/api';
import { AuthProvider, useAuth } from './AuthContext';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const SAMPLE_USER = { id: 1, email: 'a@b.com', full_name: 'Test User', role: 'user' };

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { data: null } });
  api.post.mockResolvedValue({ data: {} });
});

describe('AuthContext', () => {
  it('khởi tạo user = null khi localStorage trống', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('khởi tạo state từ localStorage khi có token + user', () => {
    localStorage.setItem('token', 'tok-123');
    localStorage.setItem('user', JSON.stringify(SAMPLE_USER));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(SAMPLE_USER);
  });

  it('không khôi phục user nếu thiếu token', () => {
    // Chỉ có user, không có token -> coi như chưa đăng nhập
    localStorage.setItem('user', JSON.stringify(SAMPLE_USER));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
  });

  it('login lưu token + user vào localStorage và cập nhật state', async () => {
    api.post.mockResolvedValueOnce({
      data: { token: 'new-token', user: SAMPLE_USER },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('a@b.com', 'secret');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'secret',
    });
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(SAMPLE_USER);
    expect(result.current.user).toEqual(SAMPLE_USER);
  });

  it('logout gọi /auth/logout rồi xoá token + user khỏi localStorage', async () => {
    localStorage.setItem('token', 'tok-123');
    localStorage.setItem('user', JSON.stringify(SAMPLE_USER));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('B54: logout xoá cả dữ liệu cá nhân (thông tin giao hàng, mã giảm giá), không chỉ token', async () => {
    localStorage.setItem('token', 'tok-123');
    localStorage.setItem('user', JSON.stringify(SAMPLE_USER));
    localStorage.setItem('last_shipping_info:1', JSON.stringify({ name: 'Test', phone: '0379247715' }));
    localStorage.setItem('last_shipping_info', JSON.stringify({ name: 'Khoá cũ' }));
    localStorage.setItem('active_coupon_code', 'CHAOMUNG');

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.length).toBe(0);
  });

  it('B54: đăng nhập tài khoản khác xoá thông tin giao hàng người trước để lại, giữ mã giảm giá đang kích hoạt', async () => {
    // Người trước (id 5) tắt trình duyệt mà không đăng xuất
    localStorage.setItem('last_shipping_info:5', JSON.stringify({ name: 'Người trước' }));
    localStorage.setItem('last_shipping_info', JSON.stringify({ name: 'Khoá cũ' }));
    localStorage.setItem('active_coupon_code', 'CHAOMUNG');
    api.post.mockResolvedValueOnce({ data: { token: 'new-token', user: SAMPLE_USER } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('a@b.com', 'secret');
    });

    expect(localStorage.getItem('last_shipping_info:5')).toBeNull();
    expect(localStorage.getItem('last_shipping_info')).toBeNull();
    expect(localStorage.getItem('active_coupon_code')).toBe('CHAOMUNG');
  });

  it('updateUser gộp dữ liệu mới và lưu lại localStorage', async () => {
    localStorage.setItem('token', 'tok-123');
    localStorage.setItem('user', JSON.stringify(SAMPLE_USER));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.updateUser({ full_name: 'Đổi Tên' });
    });

    await waitFor(() => {
      expect(result.current.user.full_name).toBe('Đổi Tên');
    });
    expect(JSON.parse(localStorage.getItem('user')).full_name).toBe('Đổi Tên');
  });
});
