# KẾ HOẠCH NÂNG CẤP GIAO DIỆN CỬA HÀNG SÁCH (PHASE 3)
## PHONG CÁCH: TẠP CHÍ NGHỆ THUẬT (EDITORIAL / MINIMALIST)

Dựa trên mẫu thiết kế `demo_giaoDien.jpg` (Cup of Couple), giao diện cửa hàng sẽ được tái cấu trúc hoàn toàn từ bố cục (layout) đến màu sắc, font chữ và các chi tiết viền (borders) để mang lại cảm giác sang trọng, cổ điển và thanh lịch.

### 1. Cấu Hình & Tài Nguyên (Config & Assets)
- **Màu sắc chủ đạo**:
  - Nền toàn trang: Màu be nhạt / xám trắng (Beige `#f4f3ee`).
  - Chữ chính: Đen (`#111111`) và Xám đậm (`#444444`).
- **Font chữ (Typography)**:
  - Cập nhật `index.html`: Chèn link Google Fonts (`Playfair Display` cho Serif, `Inter` cho Sans-serif).
  - Sử dụng Font Serif có chân cho Tiêu đề sách, Logo và các Heading lớn.
  - Sử dụng Font Sans-serif gọn gàng cho văn bản mô tả, giá tiền, tên tác giả.
  - Cập nhật `tailwind.config.js` để tích hợp `fontFamily`.

### 2. Thành Phần: Header & Navbar (`Navbar.jsx`)
- Loại bỏ hoàn toàn khối nền màu xanh dương hiện tại. Đưa về nền trong suốt `#f4f3ee`.
- **Logo**: Phóng to, căn giữa, sử dụng font Serif (in hoa, ví dụ: `SMART DIGITAL LIBRARY`).
- **Menu điều hướng**:
  - Các đường link (Trang Chủ | Admin | Đăng Nhập) sử dụng font chữ mỏng, in hoa.
  - Phân cách giữa các link bằng đường kẻ dọc cực mỏng (`border-r border-[#d4d4d4]` với độ dày 1px).
- Bổ sung các đường kẻ ngang mảnh phân tách toàn bộ khu vực Header với phần nội dung bên dưới.

### 3. Thành Phần: Trang Chủ (`HomePage.jsx`)
- **Tiêu đề trang**: Căn giữa, font Serif sang trọng.
- **Thanh Tìm Kiếm (Search)**:
  - Tối giản hóa. Bỏ khung (border) dày, viền cong, thay vào đó là một thanh nhập liệu trong suốt, chữ nghiêng (italic) *Search...*, căn phải trên navbar.
- **Bộ Lọc Danh Mục (Category Menu)**:
  - Bỏ các nút (pills/chips) hình viên thuốc.
  - Chuyển thành một thanh ngang gồm các cụm chữ in hoa, cách nhau bởi đường kẻ dọc mảnh.
- **Lưới Sản Phẩm (Grid Layout)**:
  - Đổi từ lưới 4 cột sang dạng lưới 2 cột hoặc lưới mảng lớn (Featured) xen kẽ lưới nhỏ trên Desktop.

### 4. Thành Phần: Thẻ Sách (`BookCard.jsx`)
- Bỏ hoàn toàn: Bo góc (border-radius), đổ bóng (box-shadow), viền bao quanh (border). Thẻ sách sẽ phẳng hoàn toàn.
- **Bố cục (Editorial Style)**:
  - **Hình ảnh sách**: Kích thước rất lớn, sắc nét, chiếm phần lớn không gian thẻ. Không bo góc.
  - **Đường kẻ ngang**: 1px mảnh nằm ngay dưới hình ảnh hoặc ngay dưới Tiêu đề.
  - **Tên Sách**: Font Serif, chữ rất to, sang trọng.
  - **Thông tin Meta**: Thể loại (căn trái), Ngày nhập/Giá (căn phải) sử dụng chữ in hoa, kích thước nhỏ.
  - **Nút "Thêm vào giỏ"**: Tối giản, dạng văn bản hoặc icon cực kỳ tinh tế, không làm rối mắt phần text của sách.
- **Backend Integration**: Hiển thị trạng thái kho (Còn X quyển) bằng cách join bảng `inventory` vào hàm lấy sách.

### 5. Backend Updates (`Book.js`, `bookController.js`)
- Cập nhật hàm `Book.getAll()` để JOIN với bảng `inventory`. Trả về `available_qty` và `reserved_qty` cho mỗi cuốn sách để tính số tồn thực tế phục vụ cho nhãn dán tồn kho.
