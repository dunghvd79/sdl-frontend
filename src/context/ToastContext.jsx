import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// ─── Toast Item Component ──────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const icons = {
    success: (
      <svg className="w-5 h-5 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  const bars = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-400',
  };

  return (
    <div
      className="relative flex items-start gap-3 w-80 bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-2xl px-4 py-3.5 overflow-hidden"
      style={{
        animation: 'slideInRight 0.35s cubic-bezier(.21,1.02,.73,1) both',
      }}
    >
      {/* Thanh màu bên trái */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${bars[toast.type]}`} />

      {/* Icon */}
      <div className="mt-0.5">{icons[toast.type]}</div>

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-bold text-gray-900 text-sm leading-snug">{toast.title}</div>
        )}
        <div className={`text-gray-600 text-sm leading-snug ${toast.title ? 'mt-0.5' : ''}`}>
          {toast.message}
        </div>
      </div>

      {/* Nút đóng */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-gray-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${bars[toast.type]} opacity-40`}
        style={{ animation: `shrink ${toast.duration}ms linear forwards` }}
      />
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}

// ─── Provider ────────────────────────────────────────────────────────────
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * Hiển thị toast
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {string} message
   * @param {object} options  { title, duration }
   */
  const showToast = useCallback((type, message, options = {}) => {
    const { title, duration = 3500 } = options;
    const id = nextId++;
    setToasts(prev => [...prev, { id, type, message, title, duration }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  // Shorthand helpers - dùng useMemo để không thay đổi reference mỗi lần render
  const toast = React.useMemo(() => ({
    success: (message, opts) => showToast('success', message, opts),
    error: (message, opts) => showToast('error', message, opts),
    info: (message, opts) => showToast('info', message, opts),
    warning: (message, opts) => showToast('warning', message, opts),
  }), [showToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}
