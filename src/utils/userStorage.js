// Dữ liệu cá nhân lưu trên trình duyệt (B54).
// Máy có thể DÙNG CHUNG (gia đình, quán net, công ty): dữ liệu của người này không được lộ sang người đăng nhập sau.
// - Dữ liệu cá nhân gắn khoá theo tài khoản: `<tên>:<userId>` — người khác đăng nhập không đọc được.
// - Mọi đường đăng xuất gọi clearPersonalData(); đăng nhập gọi clearOtherUsersData(id) cho trường hợp người
//   trước tắt trình duyệt mà không đăng xuất.
// Thêm khoá dữ liệu cá nhân mới thì khai báo ở đây — không tự gọi localStorage.removeItem rải rác.

export const SHIPPING_INFO_KEY = 'last_shipping_info'; // tên, SĐT, email, địa chỉ giao hàng lần trước
export const ACTIVE_COUPON_KEY = 'active_coupon_code'; // mã giảm giá đã kích hoạt ở Trạm Khuyến Mãi

const SESSION_KEYS = ['token', 'user'];
const USER_SCOPED_KEYS = [SHIPPING_INFO_KEY];

function safeStorage(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback; // trình duyệt chặn storage / dữ liệu hỏng: coi như không có
  }
}

function currentUserId() {
  return safeStorage(() => {
    if (!localStorage.getItem('token')) return null;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user && user.id != null ? String(user.id) : null;
  }, null);
}

function scopedKey(name, userId = currentUserId()) {
  return userId ? `${name}:${userId}` : null;
}

export function getUserItem(name) {
  const key = scopedKey(name);
  if (!key) return null;
  return safeStorage(() => JSON.parse(localStorage.getItem(key) || 'null'), null);
}

export function setUserItem(name, value) {
  const key = scopedKey(name);
  if (!key) return;
  safeStorage(() => localStorage.setItem(key, JSON.stringify(value)));
}

export function removeUserItem(name) {
  const key = scopedKey(name);
  if (key) safeStorage(() => localStorage.removeItem(key));
}

// Khoá thuộc nhóm dữ liệu gắn tài khoản: khoá cũ không gắn tài khoản (`name`) hoặc `name:<id>`
function matchScoped(key) {
  for (const name of USER_SCOPED_KEYS) {
    if (key === name) return { name, userId: null };
    if (key.startsWith(`${name}:`)) return { name, userId: key.slice(name.length + 1) };
  }
  return null;
}

function removeKeys(shouldRemove) {
  safeStorage(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.filter(shouldRemove).forEach(key => localStorage.removeItem(key));
  });
}

// Đăng xuất (mọi đường): xoá phiên + mọi dữ liệu cá nhân của MỌI tài khoản trên máy này
export function clearPersonalData() {
  removeKeys(key => SESSION_KEYS.includes(key) || key === ACTIVE_COUPON_KEY || matchScoped(key) !== null);
}

// Đăng nhập: xoá dữ liệu người khác để lại (và khoá cũ không gắn tài khoản), giữ của tài khoản sắp dùng.
// Giữ mã giảm giá đang kích hoạt: khách vãng lai kích hoạt mã rồi mới đăng nhập để thanh toán.
export function clearOtherUsersData(userId) {
  const keep = userId != null ? String(userId) : null;
  removeKeys(key => {
    const match = matchScoped(key);
    return match !== null && match.userId !== keep;
  });
}
