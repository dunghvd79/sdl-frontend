# CHECKLIST THEO DÕI TIẾN ĐỘ: ĐỒNG BỘ GIAO DIỆN CÁC TRANG CHÍNH

Dưới đây là bảng tiến độ chi tiết của quá trình nâng cấp, được phân nhỏ theo từng trang để dễ dàng theo dõi và tích hợp.

---

## 🟩 Giai đoạn 1: Đăng Nhập & Đăng Ký
- [ ] **Trang Đăng Nhập (`LoginPage.jsx`)**
  - [ ] Loại bỏ bo góc tròn to (`rounded-xl`), thay bằng `rounded-none` hoặc `rounded-sm`.
  - [ ] Xóa bỏ bóng đổ (`shadow-lg`).
  - [ ] Thay đổi viền input và hiệu ứng focus (chuyển từ vòng xanh dương sang đường kẻ đen mảnh).
  - [ ] Đổi nút đăng nhập từ màu xanh dương (`bg-blue-600`) sang màu đen tuyền (`bg-gray-900 hover:bg-[#c56017]`).
- [ ] **Trang Đăng Ký (`RegisterPage.jsx`)**
  - [ ] Cải tiến thiết kế form giống trang Đăng Nhập.
  - [ ] Tích hợp custom `useToast` thành công đã làm ở bước trước.

---

## 🟩 Giai đoạn 2: Chi Tiết Sản Phẩm & Chat AI
- [ ] **Trang Chi Tiết Sách (`BookDetailPage.jsx`)**
  - [ ] Định dạng lại ảnh bìa sách: To phẳng, viền mỏng 1px sang trọng.
  - [ ] Áp dụng font Serif cho Tiêu đề sách (`text-4xl md:text-5xl`).
  - [ ] Định dạng lại các Badge thể loại và thuộc tính (dùng viền mảnh chữ hoa).
  - [ ] Thiết kế lại nút "Thêm giỏ hàng" sang phong cách phẳng viền đen.
  - [ ] Thiết kế lại nút "Chat AI": Đổi từ tím gradient sang màu cam đất (`bg-[#c56017]`).
- [ ] **Trang Chat AI Với Sách (`ChatPage.jsx`)**
  - [ ] Thiết kế lại cột thông tin sách bên trái theo dạng tối giản.
  - [ ] Thay đổi bong bóng tin nhắn của User: Xám đậm/Cam đất, bo góc tối giản.
  - [ ] Thay đổi bong bóng tin nhắn của AI: Nền be nhạt hoặc trắng, viền mỏng.
  - [ ] Chuyển màu hiệu ứng 3 chấm loading từ xanh dương sang cam đất.
  - [ ] Cải tiến thanh nhập liệu phía dưới (Focus viền đen mảnh, nút gửi phẳng).

---

## 🟩 Giai đoạn 3: Giỏ Hàng & Thanh Toán
- [ ] **Trang Giỏ Hàng (`CartPage.jsx`)**
  - [ ] Chuyển danh sách sản phẩm thành dạng bảng/danh mục phẳng phân cách bởi viền 1px mỏng.
  - [ ] Thay đổi nút tăng/giảm số lượng và nút xóa thành phong cách tối giản.
  - [ ] Thay thế `window.confirm()` bằng component `ConfirmDialog` khi xóa sách.
  - [ ] Tích hợp `useToast` thông báo thay cho `alert` mặc định.
  - [ ] Chuyển màu nền cột tóm tắt đơn hàng thành be cát nhạt (`bg-[#e8e4db]`).
  - [ ] Thay nút tiến hành thanh toán thành nút phẳng màu đen.

---

## 🟩 Giai đoạn 4: Bổ sung & Hoàn thiện
- [ ] **Trang Chủ (`HomePage.jsx`)**
  - [ ] Bổ sung phân đoạn **Hero Intro** nghệ thuật có chữ Serif và hình ảnh nghệ thuật/bồ câu minh họa.
- [ ] **Đồng bộ hóa các Dialog toàn hệ thống (`ConfirmDialog.jsx`)**
  - [ ] Thay đổi màu sắc mặc định của `ConfirmDialog` từ màu xanh dương/đỏ loét sang màu xám đen/cam đất nhẹ nhàng hơn để khớp với layout.
