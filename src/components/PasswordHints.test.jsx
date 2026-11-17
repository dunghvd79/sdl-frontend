import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordRules, PasswordMismatch } from './PasswordHints';

describe('PasswordRules', () => {
  it('liệt kê quy tắc và đánh dấu điều kiện đã đạt khi gõ', () => {
    const { rerender } = render(<PasswordRules id="pw-rules" password="" />);
    const length = screen.getByText('Ít nhất 8 ký tự').closest('li');
    const mix = screen.getByText('Có cả chữ cái và chữ số').closest('li');
    expect(screen.getByRole('list')).toHaveAttribute('id', 'pw-rules');
    expect(length).toHaveAttribute('data-met', 'false');
    expect(mix).toHaveAttribute('data-met', 'false');

    rerender(<PasswordRules id="pw-rules" password="abcdefgh" />);
    expect(length).toHaveAttribute('data-met', 'true');
    expect(mix).toHaveAttribute('data-met', 'false');

    rerender(<PasswordRules id="pw-rules" password="abcd1234" />);
    expect(mix).toHaveAttribute('data-met', 'true');
  });

  it('trình đọc màn hình biết điều kiện nào đã đạt', () => {
    render(<PasswordRules id="r" password="abcdefgh" />);
    expect(screen.getByText('Ít nhất 8 ký tự').closest('li')).toHaveTextContent('Đã đạt');
    expect(screen.getByText('Có cả chữ cái và chữ số').closest('li')).toHaveTextContent('Chưa đạt');
  });
});

describe('PasswordMismatch', () => {
  it('chỉ báo khi đã nhập ô xác nhận và khác mật khẩu', () => {
    const { rerender } = render(<PasswordMismatch id="m" password="abcd1234" confirm="" />);
    expect(screen.queryByText('Mật khẩu xác nhận không khớp.')).toBeNull();

    rerender(<PasswordMismatch id="m" password="abcd1234" confirm="abcd" />);
    expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toHaveAttribute('id', 'm');

    rerender(<PasswordMismatch id="m" password="abcd1234" confirm="abcd1234" />);
    expect(screen.queryByText('Mật khẩu xác nhận không khớp.')).toBeNull();
  });
});
