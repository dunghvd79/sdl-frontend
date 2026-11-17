import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GoogleLoginButton from './GoogleLoginButton';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

function stubGoogle() {
  const id = { initialize: vi.fn(), renderButton: vi.fn() };
  window.google = { accounts: { id } };
  return id;
}

beforeEach(() => {
  delete window.google;
  document.querySelectorAll(`script[src="${GSI_SRC}"]`).forEach(s => s.remove());
});

afterEach(() => {
  delete window.google;
});

describe('GoogleLoginButton', () => {
  it('chưa cấu hình Client ID → không hiển thị gì, không tải script Google', () => {
    const { container } = render(<GoogleLoginButton clientId="" onCredential={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(document.querySelector(`script[src="${GSI_SRC}"]`)).toBeNull();
  });

  it('có Client ID → khởi tạo Google với đúng client_id và vẽ nút', async () => {
    const id = stubGoogle();
    render(<GoogleLoginButton clientId="abc.apps.googleusercontent.com" onCredential={vi.fn()} />);

    await waitFor(() => expect(id.renderButton).toHaveBeenCalledTimes(1));
    expect(id.initialize).toHaveBeenCalledWith(expect.objectContaining({
      client_id: 'abc.apps.googleusercontent.com',
      callback: expect.any(Function),
    }));
    expect(id.renderButton.mock.calls[0][0]).toBe(screen.getByTestId('google-login-button'));
  });

  it('Google trả credential → gọi onCredential với credential đó', async () => {
    const id = stubGoogle();
    const onCredential = vi.fn();
    render(<GoogleLoginButton clientId="abc" onCredential={onCredential} />);
    await waitFor(() => expect(id.initialize).toHaveBeenCalled());

    id.initialize.mock.calls[0][0].callback({ credential: 'id-token-tu-google' });

    expect(onCredential).toHaveBeenCalledWith('id-token-tu-google');
  });

  it('dải "hoặc" chỉ hiện khi nút Google đã vẽ xong; script bị chặn → không còn dải thừa', async () => {
    render(<GoogleLoginButton clientId="abc" divider onCredential={vi.fn()} />);
    expect(screen.queryByText('hoặc')).toBeNull();

    const script = document.querySelector(`script[src="${GSI_SRC}"]`);
    script.dispatchEvent(new Event('error'));
    await new Promise(r => setTimeout(r, 0));
    expect(screen.queryByText('hoặc')).toBeNull();
  });

  it('nút vẽ xong → hiện dải "hoặc"', async () => {
    stubGoogle();
    render(<GoogleLoginButton clientId="abc" divider onCredential={vi.fn()} />);
    expect(await screen.findByText('hoặc')).toBeInTheDocument();
  });

  it('chưa có thư viện Google → tải script đúng một lần cho nhiều nút, tải xong mới vẽ nút', async () => {
    render(
      <>
        <GoogleLoginButton clientId="abc" onCredential={vi.fn()} />
        <GoogleLoginButton clientId="abc" onCredential={vi.fn()} />
      </>
    );
    const scripts = document.querySelectorAll(`script[src="${GSI_SRC}"]`);
    expect(scripts).toHaveLength(1);

    const id = stubGoogle();
    scripts[0].dispatchEvent(new Event('load'));

    await waitFor(() => expect(id.renderButton).toHaveBeenCalledTimes(2));
  });
});
