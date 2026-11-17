import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
  it('mặc định ẩn mật khẩu; bấm nút thì hiện, bấm lần nữa thì ẩn lại', async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Mật khẩu" defaultValue="abc12345" />);
    const input = screen.getByLabelText('Mật khẩu');

    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('bấm nút không gửi form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="Mật khẩu" />
      </form>
    );

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('chuyển tiếp props cho ô nhập (value, onChange, required, autoComplete)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordInput aria-label="Mật khẩu" value="" onChange={onChange} required autoComplete="new-password" />);
    const input = screen.getByLabelText('Mật khẩu');

    expect(input).toBeRequired();
    expect(input).toHaveAttribute('autocomplete', 'new-password');
    await user.type(input, 'x');
    expect(onChange).toHaveBeenCalled();
  });

  it('ô nhập bị khoá thì nút cũng bị khoá', () => {
    render(<PasswordInput aria-label="Mật khẩu" disabled />);
    expect(screen.getByRole('button', { name: 'Hiện mật khẩu' })).toBeDisabled();
  });
});
