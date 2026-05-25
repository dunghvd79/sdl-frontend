# THEO DÕI TIẾN ĐỘ: NÂNG CẤP GIAO DIỆN (EDITORIAL REDESIGN)

## Giai đoạn 1: Chuẩn bị Cấu hình & Backend
- [ ] [Sửa] Cập nhật `index.html`: Thêm link Google Fonts (Playfair Display, Inter).
- [ ] [Sửa] Cập nhật `tailwind.config.js`: Khai báo `fontFamily: { serif, sans }`.
- [ ] [Sửa] Cập nhật `index.css`: Đặt `body` màu `#f4f3ee`, text màu xám đen.
- [ ] [Sửa] Backend: Cập nhật hàm `getAll` trong `Book.js` để JOIN bảng `inventory` lấy thông tin tồn kho.

## Giai đoạn 2: Navbar & Layout
- [ ] [Sửa] Thiết kế lại `Navbar.jsx` theo phong cách Editorial.
  - Logo to căn giữa bằng font Serif.
  - Thêm các đường kẻ 1px (ngang, dọc).
  - Tối giản hóa ô Search thành *Search...*.
  - Di chuyển các link thành menu nằm ngang chia bởi gạch dọc.

## Giai đoạn 3: Trang chủ & Bộ lọc
- [ ] [Sửa] Cập nhật `HomePage.jsx`.
  - Thay đổi menu danh mục (bỏ dạng viên thuốc, dùng dạng Text in hoa chia bởi đường kẻ).
  - Sửa lại Grid hiển thị thẻ sách thành lưới lớn (2 cột).

## Giai đoạn 4: Thẻ sách
- [ ] [Sửa] Thiết kế lại `BookCard.jsx`.
  - Bỏ bóng đổ, bỏ viền, bỏ bo góc.
  - Ảnh sách lớn, font Serif cho tựa đề.
  - Bổ sung thông tin Tồn kho và Giá theo chuẩn Minimalist.
  - Nút thêm vào giỏ hàng tinh gọn.
