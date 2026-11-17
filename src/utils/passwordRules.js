// Chính sách mật khẩu mới — khớp `validateNewPassword` ở backend (≥ 8 ký tự, có chữ cái và chữ số).
// Dùng chung cho: gợi ý tick từng điều kiện khi gõ (PasswordRules) và kiểm tra trước khi gửi form.
export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'Ít nhất 8 ký tự',
    error: 'Mật khẩu phải chứa ít nhất 8 ký tự.',
    test: (p) => p.length >= 8,
  },
  {
    id: 'mix',
    label: 'Có cả chữ cái và chữ số',
    error: 'Mật khẩu phải bao gồm cả chữ cái và chữ số.',
    test: (p) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p),
  },
];

// Câu lỗi của quy tắc đầu tiên bị vi phạm, hoặc null nếu hợp lệ
export function passwordError(password) {
  const failed = PASSWORD_RULES.find(rule => !rule.test(password || ''));
  return failed ? failed.error : null;
}
