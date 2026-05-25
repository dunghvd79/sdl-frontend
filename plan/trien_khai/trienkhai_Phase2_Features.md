# 🚀 Kế hoạch Triển khai — SDL Phase 2 Feature Expansion

**Tên file:** `trienkhai_Phase2_Features.md`  
**Ngày tạo:** 20/05/2026  
**Tham chiếu kế hoạch:** [SDL_PHASE2_FEATURES_PLAN.md](../SDL_PHASE2_FEATURES_PLAN.md)

---

## 📦 Thứ tự Triển khai

Thực hiện **tuần tự** theo thứ tự sau để tránh phụ thuộc:

```
[5] Toast/ConfirmDialog → [1] Profile → [4] Lọc/Sắp xếp → [2] Admin Orders → [3] Admin Users
 (nền tảng UI)           (đơn giản)    (Backend + FE)     (phức tạp nhất)   (tương tự #2)
```

---

## ✅ BƯỚC 1: Toast & ConfirmDialog (Nền tảng UI chung)

> Làm trước vì các bước sau đều cần Toast và ConfirmDialog

### 1.1 Tạo `ConfirmDialog.jsx`
**File:** `e:\it-project\smart_digital_library\code_frontend\sdl-frontend\src\components\ConfirmDialog.jsx`

```jsx
// Props: isOpen, title, message, confirmText, cancelText, onConfirm, onCancel
// - Overlay đen mờ
// - Card trắng căn giữa với animation scale-in
// - Nút Xác nhận (đỏ) + Nút Hủy (xám)
```

### 1.2 Cập nhật `AdminDashboardPage.jsx`
- Import `useToast` từ `ToastContext`
- Import `ConfirmDialog`
- Thêm state: `const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, ... })`
- Thay toàn bộ `alert(...)` → `toast.success(...)` hoặc `toast.error(...)`
- Thay `window.confirm(...)` → mở `ConfirmDialog` rồi xử lý trong `onConfirm`

**Danh sách alert() cần thay trong AdminDashboard:**
- `alert('Lỗi: ...')` trong `saveMutation.onError` (BookManager)
- `alert('Lỗi xóa sách: ...')` trong `deleteMutation.onError`
- `window.confirm('Bạn chắc chắn muốn xóa sách...')` → ConfirmDialog
- `alert('Số lượng không hợp lệ!')` trong InventoryManager
- `alert('Vui lòng chọn file PDF trước!')` trong RAGIndexer

---

## ✅ BƯỚC 2: Trang Profile Người dùng

### 2.1 Backend — `src/controllers/userController.js` [NEW]
```javascript
class UserController {
  // GET /api/users/profile
  static async getProfile(req, res) { ... }
  
  // PUT /api/users/profile  
  static async updateProfile(req, res) {
    // Chỉ cập nhật full_name
    // UPDATE users SET full_name = $1 WHERE id = $2 RETURNING *
  }
  
  // PUT /api/users/change-password
  static async changePassword(req, res) {
    // 1. Lấy user từ DB (để lấy password_hash hiện tại)
    // 2. bcrypt.compare(currentPassword, user.password_hash)
    // 3. Nếu đúng: bcrypt.hash(newPassword, 10)
    // 4. UPDATE users SET password_hash = $1 WHERE id = $2
  }
}
```

### 2.2 Backend — `src/routes/users.js` [NEW]
```javascript
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/change-password', verifyToken, userController.changePassword);
```

### 2.3 Backend — `src/config/app.js` [MODIFY]
```javascript
app.use('/api/users', require('../routes/users'));
```

### 2.4 Frontend — `src/pages/ProfilePage.jsx` [NEW]
```
Cấu trúc trang:
┌─────────────────────────────────────────┐
│  Avatar (chữ cái đầu, nền gradient)     │
│  Hoàng Dũng  |  ADMIN badge            │
├──────────────┬──────────────────────────┤
│ Thông tin    │  Họ và tên: [input]     │
│ cá nhân      │  Email: hdungx@gmail... │
│              │  Role: ADMIN (tĩnh)     │
│              │  [Lưu thay đổi]         │
├──────────────┼──────────────────────────┤
│ Đổi mật      │  MK hiện tại: [input]  │
│ khẩu         │  MK mới:      [input]  │
│              │  Xác nhận MK: [input]  │
│              │  [Đổi mật khẩu]        │
└──────────────┴──────────────────────────┘
```

### 2.5 Frontend — `src/components/Navbar.jsx` [MODIFY]
- Thêm link "👤 Tài khoản" → `/profile` bên cạnh tên user
- Hoặc làm dropdown khi click tên user (tùy chọn)

### 2.6 Frontend — `src/App.jsx` [MODIFY]
```jsx
import ProfilePage from './pages/ProfilePage';
// ...
<Route path="/profile" element={<ProfilePage />} />
```

---

## ✅ BƯỚC 3: Lọc/Sắp xếp Sách

### 3.1 Backend — `src/models/Book.js` [MODIFY]
Nâng cấp hàm `getAll()` để nhận thêm tham số:
```javascript
static async getAll({ limit, offset, search, categoryId, minPrice, maxPrice, sortBy }) {
  // Xây dựng WHERE clause động
  // sortBy: 'newest'(default) | 'oldest' | 'price_asc' | 'price_desc'
  // categoryId: JOIN với book_categories WHERE category_id = $n
  // minPrice/maxPrice: AND b.price BETWEEN $n AND $m
}
```

### 3.2 Backend — `src/controllers/bookController.js` [MODIFY]
```javascript
static async getAllBooks(req, res) {
  const { limit, page, search, categoryId, minPrice, maxPrice, sortBy } = req.query;
  // Truyền thêm params mới xuống BookService.getBooks()
}
```

### 3.3 Backend — `src/services/bookService.js` [MODIFY]
- Cập nhật gọi `Book.getAll()` với đầy đủ params mới

### 3.4 Frontend — `src/pages/HomePage.jsx` [MODIFY]
```jsx
// Thêm state:
const [selectedCategory, setSelectedCategory] = useState(null);
const [sortBy, setSortBy] = useState('newest');
const [priceRange, setPriceRange] = useState({ min: '', max: '' });

// Bộ lọc UI:
// - Fetch danh sách category từ /api/categories
// - Render chip/pill ngang: [Tất cả] [Văn học] [Kỹ năng] ...
// - Dropdown sắp xếp
// - Truyền vào query params khi gọi /api/books
```

---

## ✅ BƯỚC 4: Admin — Quản lý Đơn Hàng

### 4.1 Backend — `src/controllers/adminController.js` [NEW]
```javascript
class AdminController {
  // GET /api/admin/orders?status=&page=&limit=
  static async getAllOrders(req, res) {
    // SELECT o.*, u.email, u.full_name,
    //   json_agg(json_build_object('title', b.title, 'quantity', oi.quantity, 'price', oi.price))
    //   as items
    // FROM orders o
    // JOIN users u ON o.user_id = u.id
    // JOIN order_items oi ON o.id = oi.order_id
    // JOIN books b ON oi.book_id = b.id
    // WHERE ($1::text IS NULL OR o.status = $1)
    // GROUP BY o.id, u.email, u.full_name
    // ORDER BY o.created_at DESC
    // LIMIT $2 OFFSET $3
  }

  // PUT /api/admin/orders/:orderId/status
  static async updateOrderStatus(req, res) {
    // UPDATE orders SET status = $1 WHERE id = $2 RETURNING *
  }
}
```

### 4.2 Backend — `src/routes/admin.js` [NEW]
```javascript
const router = express.Router();
router.use(verifyToken, requireRole(['ADMIN']));

router.get('/orders', adminController.getAllOrders);
router.put('/orders/:orderId/status', adminController.updateOrderStatus);
router.get('/users', adminController.getAllUsers);        // Bước 5
router.put('/users/:userId/role', adminController.updateUserRole); // Bước 5
```

### 4.3 Backend — `src/config/app.js` [MODIFY]
```javascript
app.use('/api/admin', require('../routes/admin'));
```

### 4.4 Frontend — Tab "📋 Đơn Hàng" trong `AdminDashboardPage.jsx` [MODIFY]
```
Giao diện:
┌──────────────────────────────────────────────────────┐
│ Lọc: [Tất cả ▾]  [PENDING] [PAID] [CANCELLED]       │
├────┬──────────────┬──────────┬───────┬────────┬──────┤
│ ID │ Khách hàng   │ Sách     │ Tổng  │ Status │ Hành │
│    │              │          │ tiền  │ badge  │ động │
├────┼──────────────┼──────────┼───────┼────────┼──────┤
│ #5 │ hdung@...    │ 2 cuốn   │ 210k  │ PAID ✓ │  [▾] │
│ #4 │ vdai@...     │ 1 cuốn   │ 90k   │ PEND ⏳│  [▾] │
└────┴──────────────┴──────────┴───────┴────────┴──────┘
```
- Dropdown hành động: `Đánh dấu PAID | CANCELLED | PENDING`
- Badge màu: PAID=xanh, PENDING=vàng, CANCELLED=đỏ

---

## ✅ BƯỚC 5: Admin — Quản lý Người dùng

### 5.1 Backend — `src/controllers/adminController.js` [MODIFY]
```javascript
// Thêm vào class AdminController:

// GET /api/admin/users?search=
static async getAllUsers(req, res) {
  // SELECT id, email, full_name, role, created_at
  // FROM users
  // WHERE ($1 = '' OR email ILIKE $1 OR full_name ILIKE $1)
  // ORDER BY created_at DESC
}

// PUT /api/admin/users/:userId/role
static async updateUserRole(req, res) {
  // Validation: Không cho đổi role của chính mình
  // if (req.params.userId == req.user.id) → lỗi 400
  // UPDATE users SET role = $1 WHERE id = $2 RETURNING *
}
```

### 5.2 Frontend — Tab "👥 Người Dùng" trong `AdminDashboardPage.jsx` [MODIFY]
```
Giao diện:
┌─────────────────────────────────────────────────────┐
│ 🔍 [Tìm kiếm theo tên hoặc email...              ] │
├───────────────────────────────────────────────────┤
│ Avatar │ Họ tên   │ Email        │ Role    │ Ngày đăng ký │
│  HD    │ Hoàng D. │ hdung@...   │ [ADMIN▾]│ 15/05/2026   │
│  VD    │ Văn Đại  │ vdai@...    │ [CUST▾] │ 16/05/2026   │
└─────────────────────────────────────────────────────┘
```
- Avatar: Div tròn chứa 2 chữ cái đầu, màu gradient theo role
- Dropdown Role: `CUSTOMER | CURATOR | ADMIN`
- Hàng của Admin đang đăng nhập → dropdown bị disabled + tooltip "Không thể đổi role của chính mình"

---

## 📋 Danh sách File Tổng hợp

### Backend (`E:\sdl-project`)
| File | Hành động | Tính năng |
|------|-----------|-----------|
| `src/controllers/userController.js` | [NEW] | Profile |
| `src/routes/users.js` | [NEW] | Profile |
| `src/controllers/adminController.js` | [NEW] | Orders + Users |
| `src/routes/admin.js` | [NEW] | Orders + Users |
| `src/config/app.js` | [MODIFY] | Đăng ký 2 route mới |
| `src/models/Book.js` | [MODIFY] | Filter/Sort |
| `src/controllers/bookController.js` | [MODIFY] | Filter/Sort |
| `src/services/bookService.js` | [MODIFY] | Filter/Sort |

### Frontend (`sdl-frontend/src`)
| File | Hành động | Tính năng |
|------|-----------|-----------|
| `components/ConfirmDialog.jsx` | [NEW] | Toast/Confirm |
| `pages/ProfilePage.jsx` | [NEW] | Profile |
| `pages/AdminDashboardPage.jsx` | [MODIFY] | Toast + 2 Tab mới |
| `pages/HomePage.jsx` | [MODIFY] | Filter/Sort |
| `components/Navbar.jsx` | [MODIFY] | Link Profile |
| `App.jsx` | [MODIFY] | Route /profile |

---

## 🔬 Kế hoạch Kiểm thử Từng Bước

### Bước 1 (Toast/Confirm):
- [ ] Xóa sách trong Admin → ConfirmDialog xuất hiện đẹp
- [ ] Xác nhận xóa → Toast xanh "Đã xóa thành công!"
- [ ] Hủy xóa → ConfirmDialog đóng, không xóa

### Bước 2 (Profile):
- [ ] Vào `/profile` → hiển thị đúng tên, email, role
- [ ] Sửa tên → Lưu → Navbar cập nhật tên mới ngay
- [ ] Đổi MK đúng → Toast thành công
- [ ] Đổi MK sai MK cũ → Toast lỗi
- [ ] MK mới ≠ xác nhận → báo lỗi ngay ở Frontend

### Bước 3 (Filter/Sort):
- [ ] Click chip "Văn học" → chỉ ra sách văn học
- [ ] Click chip "Tất cả" → về lại toàn bộ
- [ ] Chọn "Giá tăng dần" → sách đầu tiên có giá thấp nhất
- [ ] Kết hợp: lọc Văn học + sắp xếp Giá giảm dần

### Bước 4 (Admin Orders):
- [ ] Đặt hàng bằng user thường
- [ ] Vào Admin → Tab Đơn Hàng → thấy đơn vừa đặt
- [ ] Thay đổi status từ PENDING → PAID
- [ ] Lọc theo PAID → chỉ thấy đơn đã trả

### Bước 5 (Admin Users):
- [ ] Vào Tab Người Dùng → thấy đủ tất cả user
- [ ] Tìm kiếm "dung" → lọc đúng
- [ ] Đổi user X lên CURATOR → đăng nhập X → thấy tab Quản trị
- [ ] Thử đổi role của chính mình → bị chặn

---

> **Lưu ý:** Thực hiện đúng thứ tự vì Bước 4 & 5 phụ thuộc vào `adminController.js` cùng file.
