import React, { useEffect } from 'react';

/**
 * ConfirmDialog — Hộp thoại xác nhận thay thế window.confirm()
 * Theo phong cách Editorial/Minimalist.
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',   // 'danger' | 'warning' | 'primary'
  onConfirm,
  onCancel,
}) {
  // Khóa scroll khi dialog mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmBtnClass = {
    danger:  'bg-[#2C4A3B] hover:bg-[#1e3529]',
    warning: 'bg-[#2C4A3B] hover:bg-[#1e3529]',
    primary: 'bg-ink hover:bg-[#2C4A3B]',
  }[variant] ?? 'bg-[#2C4A3B] hover:bg-[#1e3529]';

  const iconEl = {
    danger: (
      <div className="flex items-center justify-center text-[#2C4A3B] mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    ),
    warning: (
      <div className="flex items-center justify-center text-[#2C4A3B] mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    primary: (
      <div className="flex items-center justify-center text-ink mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  }[variant];

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-xs"
        onClick={onCancel}
        style={{ animation: 'fadeIn 0.15s ease both' }}
      />

      {/* Dialog card */}
      <div
        className="relative bg-white border border-divider rounded-none w-full max-w-sm p-6 text-center shadow-none"
        style={{ animation: 'scaleIn 0.2s cubic-bezier(.21,1.02,.73,1) both' }}
      >
        <style>{`
          @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(.9) } to { opacity: 1; transform: scale(1) } }
        `}</style>

        {iconEl}

        <h3 className="text-lg font-serif font-bold text-ink uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-xs text-ink-60 leading-relaxed mb-6 font-sans">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-none bg-surface-subtle hover:bg-divider-lt text-ink font-sans text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm?.(); onCancel?.(); }}
            className={`flex-1 py-3 px-4 rounded-none text-white font-sans text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
