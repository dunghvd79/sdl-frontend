import { describe, it, expect } from 'vitest';
import { withErrorId } from './errorMessage';

// B49: lỗi hệ thống từ backend có errorId → nối mã ngắn vào câu báo để khách gửi cho quản trị
const UUID = '3f1c2a9e-1111-4222-8333-444455556666';

describe('withErrorId', () => {
  it('lỗi 500 có errorId → nối 8 ký tự đầu vào câu báo', () => {
    const out = withErrorId({ error: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.', errorId: UUID });
    expect(out.error).toBe('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau. (Mã lỗi: 3f1c2a9e)');
  });

  it('lỗi nghiệp vụ (không có errorId) → giữ nguyên', () => {
    const biz = { error: 'Giỏ hàng trống, không thể thanh toán!' };
    expect(withErrorId(biz)).toBe(biz);
  });

  it('gọi hai lần không nối hai lần', () => {
    const once = withErrorId({ error: 'Lỗi', errorId: UUID });
    expect(withErrorId(once).error).toBe('Lỗi (Mã lỗi: 3f1c2a9e)');
  });

  it('dữ liệu lạ (null, HTML, error không phải chuỗi) → trả nguyên', () => {
    expect(withErrorId(null)).toBe(null);
    expect(withErrorId('<html>')).toBe('<html>');
    const odd = { error: { msg: 'x' }, errorId: UUID };
    expect(withErrorId(odd)).toBe(odd);
  });

  it('giữ các trường khác và không sửa object gốc', () => {
    const orig = { error: 'Lỗi', errorId: UUID, code: 'X' };
    const out = withErrorId(orig);
    expect(out.code).toBe('X');
    expect(out.errorId).toBe(UUID);
    expect(orig.error).toBe('Lỗi');
  });
});
