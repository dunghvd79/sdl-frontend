# Kế hoạch Kiểm thử: Vai trò Khách hàng (Customer - Đã đăng nhập)

Kế hoạch này tập trung kiểm thử toàn bộ trải nghiệm của người dùng có tài khoản **Khách hàng (Customer)** đã đăng nhập hệ thống, bao gồm các chức năng thương mại điện tử cốt lõi, quản lý giỏ hàng, đặt hàng, danh sách yêu thích và truy cập sách số hóa để trò chuyện cùng AI (RAG).

---

## Thông tin Tài khoản Thử nghiệm (Local Seed)
* **Email đăng nhập**: `customer@test.vn`
* **Mật khẩu**: `pasword123`

---

## Các kịch bản và bước kiểm thử chi tiết

### Kịch bản 1: Đăng nhập hệ thống (Customer Login)
* **Mục tiêu**: Đảm bảo khách hàng đăng nhập thành công và Navbar chuyển sang trạng thái cá nhân hóa.
* **Các bước thực hiện**:
  1. Từ trang chủ, bấm vào **Đăng nhập** trên thanh Menu (Navbar).
  2. Nhập Email: `customer@test.vn` và Mật khẩu: `pasword123`. Bấm **Đăng nhập**.
  3. Quan sát Navbar: Xem tên hiển thị có phải là **"Khách hàng"** hay không, và xuất hiện các menu: *Tủ sách, Yêu thích, Thông báo, Giỏ hàng, Đăng xuất*.
* **Kết quả kỳ vọng**:
  - Đăng nhập thành công, hiển thị thông báo chào mừng.
  - Navbar thay đổi trạng thái đăng nhập, ẩn nút Đăng nhập/Đăng ký và hiển thị danh mục cá nhân.

---

### Kịch bản 2: Quản lý danh sách Yêu thích (Wishlist)
* **Mục tiêu**: Đảm bảo khách hàng thêm/xóa sách yêu thích hoạt động trơn tru không lỗi.
* **Các bước thực hiện**:
  1. Truy cập trang chi tiết một cuốn sách bất kỳ (ví dụ: Doraemon hoặc Clean Code).
  2. Bấm vào nút hình **Trái tim** bên cạnh nút "Thêm vào giỏ hàng".
  3. Kiểm tra xem trái tim có chuyển sang trạng thái tô đậm màu xanh rừng (`#2C4A3B`) hay không.
  4. Bấm vào menu **Yêu thích** trên Navbar.
  5. Xác nhận cuốn sách vừa thích xuất hiện đầy đủ trong danh sách.
  6. Thử bấm biểu tượng trái tim hoặc nút xóa để loại bỏ sách khỏi danh sách yêu thích, kiểm tra danh sách có tự cập nhật động không.
* **Kết quả kỳ vọng**:
  - Thao tác thích/bỏ thích diễn ra tức thì, không cần tải lại trang.
  - Trang Danh sách yêu thích hiển thị đúng các cuốn sách tương ứng.

---

### Kịch bản 3: Thao tác Giỏ hàng (Cart Page)
* **Mục tiêu**: Đảm bảo việc thêm, thay đổi số lượng và xóa sản phẩm trong giỏ hàng chính xác.
* **Các bước thực hiện**:
  1. Tại trang chi tiết sách, bấm **Thêm vào giỏ hàng**.
  2. Xác nhận có thông báo Toast nhỏ báo thêm thành công, biểu tượng giỏ hàng trên Navbar cập nhật số lượng tăng thêm.
  3. Bấm vào biểu tượng **Giỏ hàng** trên Navbar để chuyển sang trang `/cart`.
  4. Thử tăng số lượng sản phẩm lên `2` hoặc `3` bằng nút `+`.
  5. Kiểm tra xem Đơn giá và Tổng tiền của giỏ hàng có tự động nhân và cập nhật chính xác không.
* **Kết quả kỳ vọng**:
  - Các phép tính cộng/nhân tiền giỏ hàng chính xác 100%.
  - Giao diện cập nhật động tức thì không giật lag.

---

### Kịch bản 4: Tiến hành Thanh toán & Đặt hàng (Checkout)
* **Mục tiêu**: Khách hàng điền thông tin và đặt hàng thành công.
* **Các bước thực hiện**:
  1. Tại trang Giỏ hàng, bấm nút **Tiến hành thanh toán**.
  2. Hệ thống chuyển hướng sang trang `/checkout`.
  3. Nhập đầy đủ thông tin: *Họ tên người nhận, Số điện thoại, Địa chỉ nhận hàng*.
  4. Chọn phương thức thanh toán: *Thanh toán khi nhận hàng (COD)*.
  5. Bấm **Đặt hàng ngay**.
* **Kết quả kỳ vọng**:
  - Chuyển hướng sang trang thông báo đặt hàng thành công `/payment-result`.
  - Giỏ hàng được xóa trống sau khi đặt hàng thành công.

---

### Kịch bản 5: Lịch sử đơn hàng (Order History)
* **Mục tiêu**: Đảm bảo đơn hàng vừa đặt xuất hiện trong lịch sử mua sắm.
* **Các bước thực hiện**:
  1. Truy cập Lịch sử đơn hàng qua Menu Navbar hoặc Footer.
  2. Kiểm tra xem đơn hàng vừa đặt có trạng thái ban đầu là `PENDING` (Chờ xử lý) hay không.
  3. Click **Xem chi tiết** để kiểm tra hóa đơn đặt hàng đầy đủ.
* **Kết quả kỳ vọng**:
  - Hiển thị đúng danh sách đơn hàng đã đặt cùng thời gian và tổng số tiền chuẩn xác.

---

### Kịch bản 6: Kích hoạt Đọc sách & Trò chuyện AI (RAG Chat)
* **Mục tiêu**: Trải nghiệm đọc sách số hóa và Hỏi đáp thông minh sau khi Admin phê duyệt đơn hàng thành công.
* **Các bước thực hiện**:
  1. Để sách được mở khóa trên **Tủ sách của tôi** (`/shelf`) và kích hoạt RAG, đơn hàng chứa sách đó phải ở trạng thái **DELIVERED** (Đã giao hàng thành công).
  2. *Mẹo kiểm thử*: Bạn có thể đăng nhập bằng tài khoản Admin (`admin@test.vn` / `pasword123`), truy cập trang Quản lý đơn hàng, bấm chuyển trạng thái đơn hàng của bạn từ `PENDING` -> `DELIVERED`.
  3. Quay lại đăng nhập tài khoản Khách hàng `customer@test.vn`.
  4. Bấm vào menu **Tủ sách** trên Navbar.
  5. Sách vừa mua đã xuất hiện trên kệ! Bấm **Đọc sách / Hỏi đáp AI**.
  6. Thử nghiệm gửi câu hỏi cho AI (ví dụ: *"Tác phẩm này viết về nội dung gì?"*, *"Hãy tóm tắt chương 1"*).
* **Kết quả kỳ vọng**:
  - Sách tự động được mở khóa trên kệ của khách hàng.
  - Nút Hỏi đáp AI (RAG) chuyển sang trạng thái kích hoạt (màu xanh lục).
  - Trợ lý AI trả lời thông minh dựa trên ngữ cảnh của cuốn sách.

---

## Kế hoạch hành động tiếp theo
1. **Đăng nhập và Thực hiện**: Hãy sử dụng tài khoản `customer@test.vn` để bắt đầu trải nghiệm toàn bộ luồng mua sắm và phản hồi cảm nhận của bạn.
2. **Hỗ trợ Admin**: Khi bạn thực hiện đến Kịch bản 6 cần duyệt đơn hàng, hãy báo tôi để tôi hướng dẫn bạn chuyển vai trò Admin phê duyệt nhanh chóng.
