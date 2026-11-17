import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../utils/passwordRules';

// Gợi ý dưới ô mật khẩu mới: tick từng điều kiện khi gõ. Gắn vào ô bằng aria-describedby={id}.
export function PasswordRules({ id, password }) {
  return (
    <ul id={id} className="mt-2 space-y-1">
      {PASSWORD_RULES.map(rule => {
        const met = rule.test(password || '');
        return (
          <li
            key={rule.id}
            data-met={met}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${met ? 'text-[#2C4A3B]' : 'text-ink/50'}`}
          >
            {met
              ? <Check size={12} strokeWidth={3} aria-hidden="true" />
              : <Circle size={10} aria-hidden="true" />}
            <span>{rule.label}</span>
            <span className="sr-only">{met ? ' — Đã đạt' : ' — Chưa đạt'}</span>
          </li>
        );
      })}
    </ul>
  );
}

// Báo ngay dưới ô xác nhận khi đã nhập mà không khớp
export function PasswordMismatch({ id, password, confirm }) {
  if (!confirm || confirm === password) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[11px] text-red-600">
      Mật khẩu xác nhận không khớp.
    </p>
  );
}
