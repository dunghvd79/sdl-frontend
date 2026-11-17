import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Ô mật khẩu có nút ẩn/hiện. Mọi props (value, onChange, required, autoComplete, id, ...) chuyển thẳng cho <input>.
// Nút là type="button" để bấm không gửi form; ô bị khoá thì nút cũng khoá.
export default function PasswordInput({ className = '', disabled, ...props }) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        disabled={disabled}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink/50 hover:text-ink focus-visible:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
      >
        {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}
