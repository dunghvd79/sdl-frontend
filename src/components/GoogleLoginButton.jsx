import { useEffect, useRef, useState } from 'react';

// Nút "Đăng nhập bằng Google" (spec 005) — Google Identity Services vẽ nút chính thức và trả về
// `credential` (ID token). Không có Client ID (VITE_GOOGLE_CLIENT_ID) thì không hiển thị gì.
// Script của Google chỉ tải một lần dù trang có nhiều nút.
const GSI_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null; // cho phép thử lại ở lần hiển thị sau
        script.remove();
        reject(new Error('Không tải được thư viện Google'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export default function GoogleLoginButton({
  onCredential,
  text = 'signin_with', // 'signup_with' cho trang đăng ký
  clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID,
  divider = false, // dải "hoặc" phía trên nút — ẩn cùng nút khi chưa cấu hình
}) {
  const containerRef = useRef(null);
  // Nút Google đã vẽ xong chưa — dải "hoặc" chỉ hiện khi đó (script bị chặn thì không để lại dải thừa)
  const [ready, setReady] = useState(false);
  // Giữ callback mới nhất mà không khởi tạo lại Google mỗi lần trang render
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredentialRef.current?.(response.credential),
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          locale: 'vi',
          width: Math.min(containerRef.current.offsetWidth || 320, 400),
        });
        setReady(true);
      })
      .catch(() => {
        // Mạng chặn Google: không có nút, người dùng vẫn đăng nhập bằng mật khẩu được
      });

    return () => { cancelled = true; };
  }, [clientId, text]);

  if (!clientId) return null;
  const button = <div ref={containerRef} data-testid="google-login-button" className="flex justify-center" />;
  if (!divider) return button;
  return (
    <div className={ready ? 'mt-6' : undefined}>
      {ready && (
        <div className="flex items-center gap-3 mb-5" aria-hidden="true">
          <span className="h-px flex-1 bg-divider" />
          <span className="text-[10px] font-sans font-bold tracking-widest text-ink/50 uppercase">hoặc</span>
          <span className="h-px flex-1 bg-divider" />
        </div>
      )}
      {button}
    </div>
  );
}
