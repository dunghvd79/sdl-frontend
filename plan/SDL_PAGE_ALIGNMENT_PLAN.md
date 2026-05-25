# KẾ HOẠCH ĐỒNG BỘ GIAO DIỆN CÁC TRANG CHÍNH (EDITORIAL/MINIMALIST REDESIGN)
## PHONG CÁCH CHỦ ĐẠO: ART GALLERY & MODERN MINIMALISM

Tài liệu này chi tiết hóa cách tái cấu trúc và đồng bộ hóa các trang con chính trên Frontend (bao gồm Trang Chi Tiết Sách, Giỏ Hàng, Chat AI, và các trang xác thực Đăng Nhập/Đăng Ký) để kết nối đồng điệu với Navbar và Thẻ Sách phong cách "Tạp chí nghệ thuật" (Editorial/Minimalist) có sẵn.

---

### 1. QUY CHUẨN THIẾT KẾ ĐỒNG BỘ (DESIGN SYSTEM TOKENS)

Để loại bỏ sự rời rạc, mọi trang con sẽ bắt buộc tuân thủ hệ màu sắc và hình khối sau:
*   **Màu nền toàn trang:** `#f4f3ee` (Be be cát nhẹ, ấm áp).
*   **Màu chữ chính:** `#111111` (Đen tuyền) và `#444444` (Xám đậm).
*   **Màu nhấn (Accent Color):** `#c56017` (Màu cam đất / đồng cổ).
*   **Hình khối (Borders & Shadows):**
    *   Xóa toàn bộ `shadow-lg`, `shadow-md`, `shadow-sm` (ngoại trừ các pop-up cực kỳ cần thiết). Giao diện phẳng hoàn toàn (Flat).
    *   Bo góc cực nhỏ (`rounded-sm` hoặc `rounded-none`) thay cho bo góc lớn (`rounded-2xl`, `rounded-xl`).
    *   Sử dụng đường kẻ mỏng 1px `#d4d4d4` hoặc `#e2e2e2` làm phân cách.
*   **Typography:**
    *   Tiêu đề lớn / Heading: `font-serif` (Playfair Display) in hoa, tạo độ sâu và sang trọng.
    *   Nội dung / Nút bấm / Meta: `font-sans` (Inter) mỏng, tracking rộng (`tracking-widest` hoặc `tracking-wide`), in hoa.

---

### 2. CHI TIẾT CẢI TIẾN TRÊN TỪNG TRANG CHÍNH

#### A. Trang Chi Tiết Sách (`BookDetailPage.jsx`)
*   **Bố cục (Layout):** Chia làm 2 cột rõ rệt phân cách bởi đường kẻ dọc mảnh.
    *   *Cột trái (Ảnh):* Ảnh bìa sách rất lớn, phẳng hoàn toàn, nằm gọn trong viền mỏng 1px của khung tranh.
    *   *Cột phải (Thông tin):*
        *   Tên sách: Font Serif siêu lớn (`text-4xl md:text-5xl`), in hoa, màu đen.
        *   Tác giả: Phông Sans-serif chữ hoa nghiêng nhẹ.
        *   Phần giá cả: Đặt trong 2 đường kẻ ngang mảnh, sử dụng chữ đậm.
        *   Mô tả nội dung: Căn đều hai bên (`text-justify`), khoảng cách dòng rộng rãi dễ đọc.
*   **Nút hành động:**
    *   Nút "Thêm giỏ hàng": Viền đen chữ đen nền trắng phẳng, hover đảo màu nền đen chữ be cát.
    *   Nút "Chat AI": Nền cam đất (`bg-[#c56017]`), chữ trắng phẳng, icon robot thông minh. Bỏ hiệu ứng loang màu gradient.

#### B. Trang Giỏ Hàng & Thanh Toán (`CartPage.jsx`, `CheckoutPage.jsx`)
*   **Danh sách sản phẩm:**
    *   Thay đổi từ dạng thẻ card bo tròn sang danh sách bảng (Table) phẳng tối giản.
    *   Phân cách các dòng sản phẩm bằng đường kẻ ngang mảnh 1px.
    *   Nút tăng/giảm số lượng thiết kế siêu gọn, viền mảnh.
*   **Tương tác (Dialogs):**
    *   Tích hợp component `ConfirmDialog` đã viết sẵn để thay thế hoàn toàn cho hộp thoại xác nhận `window.confirm()` thô ráp mặc định khi người dùng bấm xóa sách.
    *   Sử dụng `useToast` để báo thành công khi cập nhật số lượng hoặc áp mã.
*   **Cột Tóm tắt thanh toán:**
    *   Nền màu be nhẹ (`bg-[#e8e4db]`), chữ mảnh, nút tiến hành thanh toán dạng nút phẳng màu đen tuyền sang trọng.

#### C. Trang Phòng Chat AI Tư Vấn Sách (`ChatPage.jsx`)
*   **Cột trái (Thông tin sách):**
    *   Ảnh sách phẳng hoàn toàn, tiêu đề in hoa phong cách tối giản.
*   **Giao diện hội thoại (Chat Interface):**
    *   Bong bóng tin nhắn của User: Đổi từ màu xanh dương (`bg-blue-600`) sang màu cam đất (`bg-[#c56017]`) hoặc đen xám (`bg-stone-800`), chữ trắng, bo góc tối giản.
    *   Bong bóng tin nhắn của AI: Nền be sáng (`bg-[#e8e4db]/40`) hoặc trắng tinh, viền cực mỏng, không bo góc tròn to.
    *   Hiệu ứng Loading (3 chấm nhấp nháy): Đổi màu các hạt nhảy từ xanh dương sang màu cam đất hoặc xám.
*   **Thanh nhập liệu (Input Area):**
    *   Đường viền mỏng phẳng, khi focus đổi sang viền đen mảnh (bỏ viền xanh dương sáng). Nút gửi màu đen/cam đất phẳng.

#### D. Trang Đăng Nhập & Đăng Ký (`LoginPage.jsx`, `RegisterPage.jsx`)
*   **Cấu trúc Form:**
    *   Khung form dạng phẳng hoàn toàn, viền mảnh 1px `#d4d4d4`, nền màu be siêu nhẹ hoặc trắng.
    *   Tiêu đề: Chữ Serif in hoa, giãn cách lớn.
    *   Ô Input: Viền xám mảnh, khi click vào (focus) đổi sang viền đen hoặc cam đất, loại bỏ bóng mờ xanh dương.
    *   Nút bấm: Đen phẳng tuyền hoặc cam đất phẳng, có hiệu ứng đổi màu êm dịu khi hover.

#### E. Bổ sung Hero Intro Trang Chủ (`HomePage.jsx`)
*   Thêm một khối giới thiệu mỏng nghệ thuật ngay đầu trang chủ để tạo sự hoành tráng và chuyên nghiệp cho hiệu sách, thay vì chỉ hiển thị luôn lưới sản phẩm.

---

### 3. TIÊU CHUẨN XÁC MINH & BÀN GIAO
*   Chạy `npm run dev` để kiểm tra độ phản hồi linh hoạt (Responsive) trên cả Mobile và Desktop.
*   Kiểm tra sự tương hợp hoàn mỹ của màu sắc các nút trên toàn bộ 6 trang lớn.
*   Đảm bảo không còn bất kỳ dấu vết nào của các thành phần UI mặc định như `bg-blue-*`, `bg-indigo-*`, `bg-purple-*`.
