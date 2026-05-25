# Kế hoạch triển khai: Tính năng Mua hàng (Thanh toán COD/Online, Khóa địa chỉ & Khôi phục giỏ hàng)

Kế hoạch này phác thảo việc triển khai tính năng **Mua hàng** hoàn chỉnh, đáp ứng cả kịch bản chính và các kịch bản phụ (lỗi thanh toán, thiếu thông tin địa chỉ) theo yêu cầu thiết kế.

---

## User Review Required

> [!IMPORTANT]
> **1. Phương án lưu trữ thông tin Địa chỉ & Số điện thoại mặc định**:
> Chúng tôi đề xuất thêm trực tiếp các cột `phone` (VARCHAR) và `address` (TEXT) vào bảng `users` thay vì sử dụng bảng trung gian `user_profiles` cũ. Điều này giúp các truy vấn tải thông tin cá nhân và kiểm tra quyền được thực hiện tức thì, tránh các câu lệnh JOIN phức tạp không cần thiết.
> 
> **2. Cơ chế khóa nút Đặt hàng và thêm Địa chỉ mới**:
> Theo kịch bản phụ 2, nếu tài khoản chưa có địa chỉ, nút "Đặt hàng" sẽ bị khóa. Chúng tôi đề xuất:
> - Hiển thị một khung cảnh báo nổi bật màu đỏ gạch cổ điển báo *"Tài khoản chưa có thông tin nhận hàng mặc định"*.
> - Cho phép khách hàng điền trực tiếp thông tin vào form Checkout. Khi các trường bắt buộc (Tên, SĐT, Địa chỉ) được điền đầy đủ và đúng định dạng, nút "Đặt hàng" sẽ tự động mở khóa.
> - Bổ sung tùy chọn checkbox *"Lưu thông tin này làm địa chỉ mặc định cho tài khoản"* để cập nhật ngược lại profile của user.
> 
> **3. Cơ chế Khôi phục/Giữ lại giỏ hàng khi lỗi thanh toán**:
> - Khi chọn thanh toán bằng **Chuyển khoản**: Đơn hàng được tạo ở trạng thái `PENDING` nhưng giỏ hàng của user **chưa bị xóa**.
> - Nếu thanh toán **Thành công** (Webhook nhận status `SUCCESS`): Hệ thống cập nhật trạng thái đơn sang `CONFIRMED` và **làm trống giỏ hàng** của user.
> - Nếu thanh toán **Thất bại** (Mất mạng, hủy giao dịch...): Đơn hàng giữ nguyên `PENDING`, giỏ hàng vẫn còn nguyên vẹn. Khi quay lại trang `/payment-result?status=fail`, người dùng vẫn thấy giỏ hàng của mình còn đầy đủ để chọn thanh toán lại hoặc chọn phương thức khác (Tiền mặt).

---

## Open Questions

> [!IMPORTANT]
> **Câu hỏi 1**: Bạn có đồng ý với đề xuất thêm trực tiếp cột `phone` và `address` vào bảng `users` để tối ưu hóa hiệu năng và đơn giản hóa mã nguồn không?
> 
> **Câu hỏi 2**: Về giao diện chọn phương thức thanh toán, chúng tôi sẽ thiết kế dạng các thẻ ô vuông phẳng lớn (Flat bordered cards) sang trọng. Bạn có muốn bổ sung thêm phương thức thanh toán nào khác ngoài **Tiền mặt (COD)** và **Chuyển khoản (PayGate)** không?

---

## Proposed Changes

### 1. Database Schema (`E:\sdl-project`)

#### [NEW] [migration_purchase.js](file:///E:/sdl-project/src/utils/migration_purchase.js)
Tạo file migration để cập nhật cấu trúc bảng trong PostgreSQL:
- Thêm cột `phone` và `address` vào bảng `users` (nếu chưa có).
- Thêm cột `payment_method` vào bảng `orders` (nếu chưa có) với giá trị mặc định là `'ONLINE'`.
- Chạy khối lệnh PL/pgSQL để tự động phát hiện và gỡ bỏ check constraint cũ trên cột `status` của bảng `orders`, sau đó áp dụng ràng buộc `CHECK (status IN ('PENDING', 'CONFIRMED', 'PACKAGING', 'DELIVERING', 'DELIVERED', 'CANCELLED'))`.

---

### 2. Backend API (`E:\sdl-project`)

#### [MODIFY] [User.js](file:///E:/sdl-project/src/models/User.js)
- Cập nhật hàm `User.create` và `User.findById` để hỗ trợ select/insert thêm hai trường `phone` và `address`.
- Thêm hàm `User.updateProfileAndAddress(userId, { fullName, phone, address })` để cập nhật cả 3 thông tin trong một query duy nhất.

#### [MODIFY] [userController.js](file:///E:/sdl-project/src/controllers/userController.js)
- `UserController.getProfile`: Trả về thêm `phone` và `address` trong dữ liệu JSON.
- `UserController.updateProfile`: Cập nhật để nhận thêm `phone` và `address` từ body, tiến hành cập nhật qua `User.updateProfileAndAddress` và trả về kết quả mới nhất.

#### [MODIFY] [Order.js](file:///E:/sdl-project/src/models/Order.js)
- Cập nhật `Order.create(userId, totalAmount, shippingInfo, paymentMethod)` để chèn thêm giá trị `payment_method` vào database.
- Cập nhật hàm `Order.getUserOrders` và `Order.findById` để trả về thêm trường `payment_method`.

#### [MODIFY] [orderService.js](file:///E:/sdl-project/src/services/orderService.js)
- Cập nhật `OrderService.checkout(userId, checkoutData)`:
  - Nhận thêm tham số `paymentMethod` (`COD` hoặc `ONLINE`).
  - Gọi `Order.create` truyền thêm `paymentMethod`.
  - **Logic quan trọng**: Chỉ xóa sạch giỏ hàng (`await Cart.clear(cart.id)`) ngay lập tức nếu `paymentMethod === 'COD'`. Nếu là `'ONLINE'`, giữ nguyên giỏ hàng.

#### [MODIFY] [orderController.js](file:///E:/sdl-project/src/controllers/orderController.js)
- `OrderController.checkout`: Lấy `paymentMethod` từ `req.body`. Tiến hành validate: bắt buộc phải có và thuộc danh sách `['COD', 'ONLINE']`. Truyền tham số này xuống Service.

#### [MODIFY] [paymentService.js](file:///E:/sdl-project/src/services/paymentService.js)
- Cập nhật `PaymentService.processWebhook(data)`:
  - Khi thanh toán thành công (`status === 'SUCCESS'`), sau khi cập nhật trạng thái đơn hàng sang `'CONFIRMED'`, tiến hành tìm giỏ hàng của user ứng với đơn hàng đó và gọi `Cart.clear(cart.id)` để làm trống giỏ hàng.

---

### 3. Frontend UI (`sdl-frontend`)

#### [MODIFY] [ProfilePage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/ProfilePage.jsx)
- Thêm 2 trường nhập liệu **Số điện thoại** và **Địa chỉ mặc định** vào form thông tin cá nhân.
- Tự động lưu và cập nhật trạng thái toàn cục khi người dùng nhấn cập nhật thông tin cá nhân.

#### [MODIFY] [CheckoutPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/CheckoutPage.jsx)
- **Tải thông tin mặc định**:
  - Gửi request lấy thông tin profile của người dùng để pre-fill cho các trường Họ tên, SĐT, Địa chỉ.
- **Khóa nút đặt hàng**:
  - Hiển thị thông báo màu đỏ nhạt viền đỏ gạch khi thiếu thông tin giao hàng.
  - Sử dụng thuộc tính `disabled={!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()}` cho nút Đặt hàng để đảm bảo khách hàng điền đầy đủ mới có thể bấm.
- **Tùy chọn lưu địa chỉ mặc định**:
  - Thêm một checkbox *"Lưu thông tin giao hàng này làm địa chỉ mặc định cho tài khoản"* ở cuối form. Nếu check, khi đặt hàng thành công sẽ tự động cập nhật ngược lại profile của user.
- **Bộ chọn Phương thức thanh toán (Payment Method Selector)**:
  - Thiết kế 2 thẻ ô vuông phẳng (`rounded-none`, border 1px) nằm ngang:
    - **Tiền mặt (COD)**: Biểu tượng tiền mặt, thanh toán khi nhận hàng.
    - **Chuyển khoản**: Biểu tượng thẻ ngân hàng, thanh toán qua cổng điện tử SDL PayGate.
  - Hiển thị mô tả tương ứng cho phương thức đã chọn.
- **Cập nhật logic Submit**:
  - Truyền `paymentMethod` vào API checkout.
  - Nếu chọn `COD`: Trình duyệt hiển thị Toast thành công và tự động chuyển hướng thẳng sang `/payment-result?status=success` (không qua PayGate).
  - Nếu chọn `ONLINE`: Thực hiện quy trình chuyển hướng sang cổng thanh toán giả lập như bình thường.

---

## Verification Plan

### Automated / DB Migrations
- Chạy lệnh `node src/utils/migration_purchase.js` kiểm tra lỗi cú pháp và kiểm tra Database PostgreSQL để đảm bảo các cột mới đã được tạo và ràng buộc status đã được nâng cấp lên 6 trạng thái.

### Manual UI Verification
1. **Kiểm tra Profile**:
   - Truy cập `/profile`, nhập thêm SĐT và địa chỉ mới rồi ấn Lưu.
   - Load lại trang để đảm bảo thông tin được lưu trữ và hiển thị chính xác.
2. **Kiểm tra Khóa Địa chỉ tại Checkout**:
   - Xóa địa chỉ hoặc SĐT trong profile, truy cập `/checkout`.
   - Xác nhận có thông báo đỏ báo thiếu địa chỉ mặc định và nút **Đặt hàng** bị khóa (disabled).
   - Nhập thông tin vào các ô trống, xác nhận nút tự động mở khóa.
3. **Kiểm tra kịch bản Tiền mặt (COD)**:
   - Chọn phương thức Tiền mặt (COD) -> Nhấn Đặt hàng.
   - Xác nhận giỏ hàng bị xóa ngay lập tức, chuyển hướng về trang báo thành công và đơn hàng hiển thị trong lịch sử ở trạng thái `PENDING` (hoặc `CONFIRMED` tùy thiết kế).
4. **Kiểm tra kịch bản Chuyển khoản thất bại (Lỗi thanh toán)**:
   - Chọn phương thức Chuyển khoản -> Nhấn Đặt hàng.
   - Trên PayGate, chọn **Hủy giao dịch (Thất bại)**.
   - Xác nhận được trả về trang báo thất bại `/payment-result?status=fail`.
   - Bấm vào Giỏ hàng, xác nhận **tất cả sản phẩm vẫn còn nguyên trong giỏ**.
5. **Kiểm tra kịch bản Chuyển khoản thành công**:
   - Chọn phương thức Chuyển khoản -> Nhấn Đặt hàng.
   - Trên PayGate, chọn **Thanh toán Thành công**.
   - Xác nhận chuyển hướng về trang báo thành công và **giỏ hàng đã bị xóa sạch**.
