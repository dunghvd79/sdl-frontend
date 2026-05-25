# Kế hoạch triển khai: Phân hệ Quản trị & Vector hóa Sách (Admin/Curator Dashboard)

Kế hoạch chi tiết này giúp triển khai giao diện và API quản lý sách, tồn kho, và vector hóa tài liệu RAG.

---

## 🛡️ Yêu cầu Người dùng Duyệt (User Review Required)

> [!IMPORTANT]
> **Cài đặt thư viện `multer` ở Backend:**
> Để phục vụ chức năng tải lên file PDF từ phía Admin, tôi đề xuất cài đặt thêm thư viện `multer` cho Node.js Backend. Lệnh cài đặt là:
> `npm install multer --save` (trong thư mục `E:\sdl-project`).
> Vui lòng xác nhận đồng ý để tôi chạy lệnh này.

> [!WARNING]
> **Quyền Admin trong Database:**
> Bạn cần có ít nhất một tài khoản có vai trò `ADMIN` hoặc `CURATOR` trong database để đăng nhập và kiểm tra các tính năng này. Nếu chưa có, tôi có thể chạy câu lệnh SQL để cập nhật một tài khoản hiện tại của bạn thành role `ADMIN`.

---

## 📋 Đề xuất Thay đổi (Proposed Changes)

Chi tiết kế hoạch triển khai gồm các file sau:

### 1. Phía Backend (Node.js)

#### [NEW] [inventoryController.js](file:///E:/sdl-project/src/controllers/inventoryController.js)
* Viết API lấy danh sách kho và cập nhật số lượng có sẵn (`available_qty`).

#### [NEW] [inventory.js](file:///E:/sdl-project/src/routes/inventory.js)
* Đăng ký các endpoints của Kho hàng và áp dụng `verifyToken`, `requireRole(['ADMIN', 'CURATOR'])`.

#### [MODIFY] [app.js](file:///E:/sdl-project/src/config/app.js)
* Đăng ký router `/api/inventory` vào luồng chính.

#### [MODIFY] [ai.js](file:///E:/sdl-project/src/routes/ai.js)
* Bổ sung route `POST /api/ai/upload/:bookId` được bảo vệ, tích hợp middleware `multer` để nhận file PDF.

#### [MODIFY] [aiController.js](file:///E:/sdl-project/src/controllers/aiController.js) & [aiService.js](file:///E:/sdl-project/src/services/aiService.js)
* Viết hàm nhận file từ request upload và dùng `axios` kết hợp `FormData` để forward file PDF sang FastAPI AI Service (`POST http://127.0.0.1:8000/api/documents/upload`).

---

### 2. Phía Frontend (Vite React)

#### [NEW] [ProtectedRoute.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/components/ProtectedRoute.jsx)
* Component bảo vệ route. Nếu user chưa login hoặc role không hợp lệ, chuyển hướng về `/`.

#### [NEW] [AdminDashboardPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/AdminDashboardPage.jsx)
* Tạo màn hình quản trị hoàn chỉnh chia làm 3 Tabs chính:
  1. **Quản lý Sách:** Bảng danh sách sách, modal thêm sách mới, chức năng sửa và xóa sách.
  2. **Quản lý Kho:** Bảng thống kê tồn kho, cho phép sửa trực tiếp số lượng có sẵn (`Available Qty`).
  3. **Vector hóa RAG:** Chọn file PDF của sách và bấm tải lên để gửi sang Server. Hiện trạng loading trong lúc vector hóa.

#### [MODIFY] [Navbar.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/components/Navbar.jsx)
* Hiển thị thêm tab **"⚙️ Quản trị"** nếu `user.role === 'ADMIN' || user.role === 'CURATOR'`.

#### [MODIFY] [App.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/App.jsx)
* Khai báo Route `/admin` bọc trong `ProtectedRoute`.

---

## 🔬 Kế hoạch Xác minh & Kiểm thử (Verification Plan)

### Automated/Manual Tests:
1. Đăng nhập tài khoản thông thường (USER) -> Truy cập trực tiếp `/admin` xem có bị từ chối không.
2. Đăng nhập tài khoản ADMIN -> Truy cập `/admin` -> Thêm sách mới -> Xác nhận hiển thị đúng.
3. Thay đổi tồn kho cuốn sách mới -> Xác nhận thay đổi thành công ngoài trang chủ.
4. Chọn file PDF của sách mới -> Tải lên vector hóa -> Quan sát log python xử lý chunking và ChromaDB -> Vào trang Chat AI của sách mới và hỏi đáp để test RAG.
