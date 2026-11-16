import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserItem,
  setUserItem,
  removeUserItem,
  clearPersonalData,
  clearOtherUsersData,
  SHIPPING_INFO_KEY,
  ACTIVE_COUPON_KEY,
} from './userStorage';

// B54: dữ liệu cá nhân trên máy dùng chung không được lộ sang tài khoản khác
const loginAs = (id) => {
  localStorage.setItem('token', `tok-${id}`);
  localStorage.setItem('user', JSON.stringify({ id, email: `u${id}@test.vn` }));
};

beforeEach(() => {
  localStorage.clear();
});

describe('userStorage', () => {
  it('dữ liệu gắn theo tài khoản: người khác đăng nhập không đọc được', () => {
    loginAs(5);
    setUserItem(SHIPPING_INFO_KEY, { name: 'Khách 5', phone: '0379247715' });
    expect(getUserItem(SHIPPING_INFO_KEY)).toEqual({ name: 'Khách 5', phone: '0379247715' });

    loginAs(10);
    expect(getUserItem(SHIPPING_INFO_KEY)).toBeNull();
  });

  it('chưa đăng nhập thì không đọc / ghi dữ liệu cá nhân', () => {
    setUserItem(SHIPPING_INFO_KEY, { name: 'x' });
    expect(getUserItem(SHIPPING_INFO_KEY)).toBeNull();
    expect(Object.keys(localStorage)).toEqual([]);
  });

  it('khoá kiểu cũ không gắn tài khoản (dữ liệu trước bản sửa) không bao giờ được đọc', () => {
    localStorage.setItem(SHIPPING_INFO_KEY, JSON.stringify({ name: 'Người trước' }));
    loginAs(10);
    expect(getUserItem(SHIPPING_INFO_KEY)).toBeNull();
  });

  it('removeUserItem chỉ xoá của tài khoản hiện tại', () => {
    loginAs(5);
    setUserItem(SHIPPING_INFO_KEY, { name: 'A' });
    localStorage.setItem(`${SHIPPING_INFO_KEY}:7`, JSON.stringify({ name: 'B' }));
    removeUserItem(SHIPPING_INFO_KEY);
    expect(localStorage.getItem(`${SHIPPING_INFO_KEY}:5`)).toBeNull();
    expect(localStorage.getItem(`${SHIPPING_INFO_KEY}:7`)).not.toBeNull();
  });

  it('clearPersonalData xoá token, user, thông tin giao hàng (mọi tài khoản, cả khoá cũ), mã giảm giá; giữ khoá không liên quan', () => {
    loginAs(5);
    setUserItem(SHIPPING_INFO_KEY, { name: 'A' });
    localStorage.setItem(`${SHIPPING_INFO_KEY}:7`, '{}');
    localStorage.setItem(SHIPPING_INFO_KEY, '{}');
    localStorage.setItem(ACTIVE_COUPON_KEY, 'CHAOMUNG');
    localStorage.setItem('theme', 'dark');

    clearPersonalData();

    expect(Object.keys(localStorage)).toEqual(['theme']);
  });

  it('clearOtherUsersData giữ dữ liệu của tài khoản sắp dùng và mã giảm giá, xoá của người khác', () => {
    localStorage.setItem(`${SHIPPING_INFO_KEY}:5`, '{"name":"A"}');
    localStorage.setItem(`${SHIPPING_INFO_KEY}:7`, '{"name":"B"}');
    localStorage.setItem(SHIPPING_INFO_KEY, '{"name":"cũ"}');
    localStorage.setItem(ACTIVE_COUPON_KEY, 'CHAOMUNG');

    clearOtherUsersData(5);

    expect(Object.keys(localStorage).sort()).toEqual([ACTIVE_COUPON_KEY, `${SHIPPING_INFO_KEY}:5`].sort());
  });

  it('localStorage hỏng / user không phải JSON → coi như chưa đăng nhập, không ném lỗi', () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', '{hỏng');
    expect(getUserItem(SHIPPING_INFO_KEY)).toBeNull();
    expect(() => setUserItem(SHIPPING_INFO_KEY, { a: 1 })).not.toThrow();
  });
});
