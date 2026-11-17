import { describe, it, expect } from 'vitest';
import { PASSWORD_RULES, passwordError } from './passwordRules';

// Khớp chính sách backend (validateNewPassword): ≥ 8 ký tự, có chữ cái và chữ số
describe('passwordRules', () => {
  it('passwordError trả câu lỗi đầu tiên vi phạm, null khi hợp lệ', () => {
    expect(passwordError('')).toBe('Mật khẩu phải chứa ít nhất 8 ký tự.');
    expect(passwordError('abc1234')).toBe('Mật khẩu phải chứa ít nhất 8 ký tự.');
    expect(passwordError('abcdefgh')).toBe('Mật khẩu phải bao gồm cả chữ cái và chữ số.');
    expect(passwordError('12345678')).toBe('Mật khẩu phải bao gồm cả chữ cái và chữ số.');
    expect(passwordError('abcd1234')).toBeNull();
  });

  it('mỗi quy tắc kiểm tra riêng được (để tick từng dòng khi gõ)', () => {
    const results = (p) => PASSWORD_RULES.map(rule => rule.test(p));
    expect(results('ab1')).toEqual([false, true]);
    expect(results('abcdefgh')).toEqual([true, false]);
    expect(results('abcd1234')).toEqual([true, true]);
  });
});
