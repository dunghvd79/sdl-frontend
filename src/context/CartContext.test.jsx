import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Lý do chọn điểm test này: logic giỏ hàng (đếm số lượng, thêm hàng) nằm gọn
// trong CartContext. Test ở cấp hook là điểm DỄ nhất: không cần render UI thật,
// chỉ cần mock mạng (api) và trạng thái đăng nhập (useAuth). ToastProvider +
// MemoryRouter là thật vì CartProvider gọi useToast()/useNavigate() trực tiếp.

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: { items: [] } } })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// useAuth được mock để điều khiển user đăng nhập hay chưa.
const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import api from '../services/api';
import { CartProvider, useCart } from './CartContext';
import { ToastProvider } from './ToastContext';

const wrapper = ({ children }) => (
  <MemoryRouter>
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  </MemoryRouter>
);

const USER = { id: 1, email: 'a@b.com' };

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { data: { items: [] } } });
  api.post.mockResolvedValue({ data: {} });
  mockUseAuth.mockReturnValue({ user: null });
});

describe('CartContext', () => {
  it('cartCount = 0 và không gọi /cart khi chưa đăng nhập', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.cartCount).toBe(0));
    expect(api.get).not.toHaveBeenCalled();
  });

  it('cartCount = tổng quantity của các item từ GET /cart khi đã đăng nhập', async () => {
    mockUseAuth.mockReturnValue({ user: USER });
    api.get.mockResolvedValue({
      data: { data: { items: [{ quantity: 2 }, { quantity: 3 }] } },
    });

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(api.get).toHaveBeenCalledWith('/cart');
    await waitFor(() => expect(result.current.cartCount).toBe(5));
  });

  it('addToCart khi chưa đăng nhập KHÔNG gọi API thêm hàng', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addToCart('book-1', 'Sách A');
    });

    expect(api.post).not.toHaveBeenCalled();
  });

  it('addToCart khi đã đăng nhập gọi POST /cart/add rồi làm mới số lượng', async () => {
    mockUseAuth.mockReturnValue({ user: USER });
    // Lần fetch đầu (mount) trả rỗng; sau khi thêm, trả 1 item.
    api.get
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValue({ data: { data: { items: [{ quantity: 1 }] } } });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.cartCount).toBe(0));

    await act(async () => {
      await result.current.addToCart('book-1', 'Sách A');
    });

    expect(api.post).toHaveBeenCalledWith('/cart/add', {
      bookId: 'book-1',
      quantity: 1,
    });
    await waitFor(() => expect(result.current.cartCount).toBe(1));
  });
});
