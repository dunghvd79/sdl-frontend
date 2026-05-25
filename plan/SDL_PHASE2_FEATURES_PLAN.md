# 📋 Kế hoạch Phát triển Giai đoạn 2 — SDL Feature Expansion

**Tên file:** `SDL_PHASE2_FEATURES_PLAN.md`
**Ngày tạo:** 20/05/2026
**Mục tiêu:** Hoàn thiện 5 tính năng còn thiếu để đưa SDL lên trạng thái sản phẩm hoàn chỉnh.

---

## 🗂️ Danh sách Tính năng

| STT | Tính năng | Độ phức tạp | Ưu tiên |
|-----|-----------|-------------|---------|
| 1 | Trang Profile người dùng | Thấp | 🔴 Cao |
| 2 | Admin: Quản lý Đơn Hàng | Trung | 🔴 Cao |
| 3 | Admin: Quản lý Người dùng | Trung | 🟡 Trung |
| 4 | Lọc/Sắp xếp sách | Trung | 🟡 Trung |
| 5 | Toast thay thế alert() trong Admin | Thấp | 🟢 Thấp |

---

## 🔴 TÍNH NĂNG 1: Trang Profile Người dùng

### Mô tả
Cho phép người dùng đã đăng nhập xem và cập nhật thông tin cá nhân của mình.

### Backend cần làm

#### API `GET /api/users/profile`
- Lấy thông tin user hiện tại từ `req.user.id` (đã decode từ JWT)
- Trả về: `id`, `email`, `full_name`, `role`, `created_at`
- Bảo vệ bằng `verifyToken`

#### API `PUT /api/users/profile`
- Cập nhật `full_name` (không cho đổi email vì là tài khoản đăng nhập)
- Trả về thông tin user đã cập nhật

#### API `PUT /api/users/change-password`
- Nhận: `currentPassword`, `newPassword`
- Verify `currentPassword` bằng `bcrypt.compare`
- Hash `newPassword` bằng `bcrypt.hash`
- Cập nhật vào database

**Files sửa đổi:**
- **[NEW]** `src/controllers/userController.js`
- **[NEW]** `src/routes/users.js`
- **[MODIFY]** `src/config/app.js` — đăng ký `/api/users`

### Frontend cần làm

#### Trang `ProfilePage.jsx`
Giao diện chia làm 2 card:

**Card 1 — Thông tin cá nhân:**
- Avatar (dùng chữ cái đầu tên làm avatar tạm, ví dụ: "HD" cho "Hoàng Dũng")
- Trường `Họ và tên` — input cho phép sửa
- Email (hiển thị tĩnh, không cho sửa)
- Role badge (`CUSTOMER` / `ADMIN` / `CURATOR`)
- Nút `Lưu thay đổi`

**Card 2 — Đổi mật khẩu:**
- Input `Mật khẩu hiện tại`
- Input `Mật khẩu mới`
- Input `Xác nhận mật khẩu mới` (validate phải trùng nhau ở Frontend)
- Nút `Đổi mật khẩu`

**Files sửa đổi:**
- **[NEW]** `src/pages/ProfilePage.jsx`
- **[MODIFY]** `src/components/Navbar.jsx` — Thêm link đến `/profile`
- **[MODIFY]** `src/App.jsx` — Đăng ký route `/profile`

---

## 🔴 TÍNH NĂNG 2: Admin — Quản lý Đơn Hàng

### Mô tả
Tab mới trong `AdminDashboardPage.jsx` cho phép Admin xem TẤT CẢ đơn hàng của mọi người dùng, lọc theo trạng thái và cập nhật trạng thái đơn hàng.

### Backend cần làm

#### API `GET /api/admin/orders`
- Lấy TẤT CẢ đơn hàng của toàn bộ user (không giới hạn `user_id`)
- Hỗ trợ query params: `?status=PAID&page=1&limit=20`
- JOIN với bảng `users` để lấy `email` và `full_name` của người đặt
- JOIN với bảng `order_items` và `books` để lấy chi tiết sách
- Sắp xếp: Mới nhất lên đầu (`created_at DESC`)
- Bảo vệ bằng `verifyToken` + `requireRole(['ADMIN'])`

#### API `PUT /api/admin/orders/:orderId/status`
- Nhận: `{ status: 'PAID' | 'CANCELLED' | 'PENDING' }`
- Cập nhật trường `status` của đơn hàng
- Bảo vệ bằng `verifyToken` + `requireRole(['ADMIN'])`

**Files sửa đổi:**
- **[NEW]** `src/controllers/adminController.js`
- **[NEW]** `src/routes/admin.js`
- **[MODIFY]** `src/config/app.js` — đăng ký `/api/admin`

### Frontend cần làm

#### Tab mới "📋 Đơn Hàng" trong `AdminDashboardPage.jsx`

**Giao diện:**
- Dropdown lọc theo trạng thái: `Tất cả / PENDING / PAID / CANCELLED`
- Bảng đơn hàng gồm: Mã ĐH, Khách hàng, Tổng tiền, Trạng thái (badge màu), Ngày đặt, Hành động
- Badge màu: PAID → xanh, PENDING → vàng, CANCELLED → đỏ
- Dropdown trên mỗi dòng để thay đổi trạng thái đơn hàng
- Phân trang (nếu nhiều đơn)

**Files sửa đổi:**
- **[MODIFY]** `src/pages/AdminDashboardPage.jsx` — Thêm Tab 4

---

## 🟡 TÍNH NĂNG 3: Admin — Quản lý Người dùng

### Mô tả
Tab mới trong `AdminDashboardPage.jsx` cho phép Admin xem danh sách tất cả người dùng và thay đổi role.

### Backend cần làm

#### API `GET /api/admin/users`
- Lấy danh sách toàn bộ user: `id`, `email`, `full_name`, `role`, `created_at`
- Hỗ trợ tìm kiếm theo email/tên: `?search=nguyen`
- Bảo vệ bằng `verifyToken` + `requireRole(['ADMIN'])`

#### API `PUT /api/admin/users/:userId/role`
- Nhận: `{ role: 'CUSTOMER' | 'CURATOR' | 'ADMIN' }`
- Không cho phép Admin tự đổi role của chính mình (để tránh mất quyền)
- Bảo vệ bằng `verifyToken` + `requireRole(['ADMIN'])`

**Files sửa đổi:**
- **[MODIFY]** `src/controllers/adminController.js` — Thêm 2 method mới
- **[MODIFY]** `src/routes/admin.js` — Thêm 2 route mới

### Frontend cần làm

#### Tab mới "👥 Người Dùng" trong `AdminDashboardPage.jsx`

**Giao diện:**
- Input tìm kiếm theo tên/email
- Bảng user: Avatar chữ cái, Tên, Email, Role badge, Ngày đăng ký, Dropdown đổi role
- Role badge màu sắc: ADMIN → đỏ, CURATOR → tím, CUSTOMER → xám
- Dropdown đổi role inline (không cần modal)
- Không hiển thị dropdown nếu đó là chính mình (so sánh với `user.id` từ AuthContext)

**Files sửa đổi:**
- **[MODIFY]** `src/pages/AdminDashboardPage.jsx` — Thêm Tab 5

---

## 🟡 TÍNH NĂNG 4: Lọc/Sắp xếp Sách

### Mô tả
Nâng cấp trang chủ (`HomePage.jsx`) với bộ lọc danh mục và sắp xếp.

### Backend cần làm

#### Nâng cấp API `GET /api/books`
Hỗ trợ thêm các query params:
- `?categoryId=2` — Lọc theo danh mục
- `?minPrice=50000&maxPrice=200000` — Lọc theo khoảng giá
- `?sortBy=price_asc|price_desc|newest|oldest` — Sắp xếp

**Files sửa đổi:**
- **[MODIFY]** `src/models/Book.js` — Thêm điều kiện WHERE và ORDER BY động
- **[MODIFY]** `src/controllers/bookController.js` — Đọc thêm query params

### Frontend cần làm

#### Thanh bộ lọc trong `HomePage.jsx`

**Giao diện (đặt bên dưới thanh tìm kiếm):**
- **Danh mục:** Dãy chip/pill ngang (`Tất cả | Văn học | Kỹ năng | Kinh tế | ...`) — click để lọc
- **Sắp xếp:** Dropdown select với options: `Mới nhất | Cũ nhất | Giá tăng dần | Giá giảm dần`
- Khi thay đổi bộ lọc → tự động refetch danh sách sách

**Files sửa đổi:**
- **[MODIFY]** `src/pages/HomePage.jsx` — Thêm filter bar + filter state

---

## 🟢 TÍNH NĂNG 5: Toast thay thế alert() trong Admin

### Mô tả
Thay toàn bộ `alert()`, `window.confirm()` còn lại trong `AdminDashboardPage.jsx` bằng Toast và Dialog đẹp hơn.

### Frontend cần làm

#### Các thay đổi trong `AdminDashboardPage.jsx`:
- Thêm `useToast()` vào tất cả tab
- Thay `alert('Lỗi: ...')` → `toast.error(...)`
- Thay `alert('Thành công: ...')` → `toast.success(...)`
- Thay `window.confirm('Bạn chắc chắn muốn xóa...')` → Modal xác nhận đẹp (không dùng confirm() của trình duyệt)

#### Tạo `ConfirmDialog.jsx` component
- Dialog xác nhận dùng chung (thay thế `window.confirm()`)
- Props: `title`, `message`, `onConfirm`, `onCancel`, `isOpen`
- Overlay mờ + animation slide-in

**Files sửa đổi:**
- **[NEW]** `src/components/ConfirmDialog.jsx`
- **[MODIFY]** `src/pages/AdminDashboardPage.jsx`

---

## 📐 Kiến trúc Tổng thể sau khi hoàn thành

```
Frontend Pages:
├── / (HomePage)           ← + Bộ lọc/Sắp xếp
├── /login, /register
├── /books/:id
├── /books/:id/chat
├── /cart
├── /checkout
├── /payment-result
├── /orders
├── /profile               ← [NEW] Trang cá nhân
└── /admin                 ← + 2 Tab mới (Đơn hàng, Người dùng)

Backend APIs:
├── /api/auth
├── /api/books             ← + Filter/Sort params
├── /api/categories
├── /api/cart
├── /api/orders
├── /api/payments
├── /api/ai
├── /api/inventory
├── /api/users             ← [NEW] Profile, đổi mật khẩu
└── /api/admin             ← [NEW] Orders + Users management
```

---

## 🔬 Kế hoạch Kiểm thử

| Tính năng | Cách kiểm thử |
|---|---|
| Profile | Đổi tên → F5 → kiểm tra tên mới trên Navbar |
| Đổi MK | Đổi MK → Logout → Login với MK mới |
| Admin Orders | Dùng user thường đặt hàng → vào Admin kiểm tra có hiện không |
| Admin đổi role | Đổi user X thành CURATOR → đăng nhập X → kiểm tra Navbar |
| Lọc sách | Chọn danh mục "Văn học" → chỉ thấy sách văn học |
| Sắp xếp giá | Chọn "Giá tăng dần" → sách đầu phải rẻ nhất |
| Toast Admin | Xóa sách → phải thấy toast đỏ xác nhận thay vì alert() |
