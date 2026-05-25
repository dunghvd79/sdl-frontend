# Cấu trúc Thiết kế Navbar Hiệu Sách (Pigeon Bookstore)

Thanh điều hướng (Navbar) của một hiệu sách trực tuyến hiện đại, đặc biệt là theo phong cách Minimalist/Editorial, thường bao gồm các nhóm chức năng chính sau:

## 1. Nhóm Điều hướng Chính (Khám phá sách)
Khu vực này giúp giữ chân khách hàng và điều hướng họ đến các nội dung quan trọng:
- **Cửa hàng / Tất cả Sách (Store/All Books):** Link dẫn đến trang hiển thị toàn bộ kho sách.
- **Danh mục / Thể loại (Categories):** Cực kỳ quan trọng. Nên sử dụng **Dropdown Menu (menu xổ xuống)** hoặc Mega Menu để hiển thị các nhóm (Văn học, Kinh tế, Tâm lý học,...) giúp khách hàng dễ dàng tìm kiếm ngay từ trang chủ.
- **Sách Mới / Bestseller:** Link nhắm thẳng vào nhu cầu khám phá sách hot, sách đang thịnh hành.
- **Góc Review / Blog (Bài viết):** Nơi chia sẻ kiến thức, review sách. Điều này giúp kích thích nhu cầu mua và xây dựng cộng đồng người đọc trung thành.

## 2. Nhóm Nhận diện Thương hiệu (Branding)
- **Logo:** Nằm ở vị trí trung tâm hoặc góc trái. Thiết kế to, rõ ràng và thể hiện cá tính thương hiệu (ví dụ: dùng font Serif sang trọng như *Pigeon Bookstore*).
- **Thanh Thông báo trên cùng (Top Banner):** Một dải màu mỏng trên cùng Navbar để truyền tải thông điệp Marketing nhanh chóng:
  - *"Miễn phí vận chuyển đơn từ 250.000đ"*
  - *"Đổi trả 30 ngày"*
  - Hotline hoặc chương trình khuyến mãi theo mùa.

## 3. Nhóm Công cụ Tìm kiếm & Tiện ích
Thường đặt ở bên phải để thuận với luồng mắt người dùng:
- **Tìm kiếm (Search 🔍):** Chức năng cốt lõi. Khách hàng thường tìm theo Tên sách hoặc Tác giả. Thiết kế tối giản có thể là một Icon kính lúp, khi click vào sẽ mở ra thanh tìm kiếm tinh tế.
- **Yêu thích (Wishlist 🤍):** Cho phép người dùng lưu lại những cuốn sách quan tâm để mua sau hoặc dùng làm quà tặng.
- **Giỏ hàng (Cart 🛒):** Kèm theo con số (badge) thể hiện số lượng sách đang có. Giao diện nâng cao thường áp dụng Mini-cart (rê chuột vào sẽ xem nhanh danh sách sản phẩm).

## 4. Nhóm Cá nhân hóa (User Profile)
- **Chưa đăng nhập:** Cung cấp link Đăng nhập / Đăng ký.
- **Đã đăng nhập:** Hiển thị dưới dạng khối Profile tinh gọn (Ví dụ: dạng viên thuốc - Pill shape gồm Avatar, Tên người dùng và Role).
  - Từ đây, khách hàng có thể truy cập vào **Lịch sử đơn hàng** hoặc thiết lập tài khoản cá nhân.
  - Cung cấp tính năng chuyển đến trang **Admin** (nếu là quản trị viên) và nút **Đăng xuất**.

---
**💡 Gợi ý Nâng cấp cho Pigeon Bookstore (Phase tiếp theo):**
1. **Dropdown Danh mục:** Nâng cấp link "DANH MỤC" thành menu xổ xuống chứa danh sách các thể loại.
2. **Hiệu ứng Tìm kiếm:** Khi click vào biểu tượng kính lúp, làm xuất hiện một thanh tìm kiếm (popup) mượt mà để nhập từ khóa.
3. **Mini-Cart:** Tích hợp giỏ hàng mini thả xuống khi người dùng trỏ chuột vào icon giỏ hàng.
