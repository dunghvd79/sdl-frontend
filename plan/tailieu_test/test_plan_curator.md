# Kế hoạch Kiểm thử: Vai trò Thủ thư (Curator - Đã đăng nhập)

Kế hoạch này tập trung kiểm thử toàn bộ trải nghiệm quản trị, quản lý sách, thể loại, kho hàng, duyệt đơn hàng, mã giảm giá và vector hóa tài liệu RAG của vai trò **Thủ thư (Curator)** trên hệ thống Smart Digital Library.

---

## Thông tin Tài khoản Thử nghiệm (Local Seed)
* **Email đăng nhập**: `curator@test.vn`
* **Mật khẩu**: `pasword123`

---

## Các kịch bản và bước kiểm thử chi tiết

### Kịch bản 1: Đăng nhập quản trị (Curator Login & Dashboard Access)
* **Mục tiêu**: Đăng nhập thành công bằng vai trò Curator và truy cập bảng điều khiển quản trị với đúng phân quyền giới hạn.
* **Các bước thực hiện**:
  1. Truy cập giao diện đăng nhập tại `http://localhost:5173/login`.
  2. Nhập Email: `curator@test.vn` và Mật khẩu: `pasword123`. Bấm **Đăng nhập**.
  3. Bấm vào nút **Quản trị** xuất hiện trên Navbar để đi tới trang `/admin`.
  4. Quan sát cấu trúc menu quản trị: Xác nhận hiển thị đầy đủ các tab *Tổng quan, Quản lý sách, Quản lý thể loại, Quản lý kho, Đơn hàng, Mã giảm giá, Vector hóa RAG*.
  5. Kiểm tra tính bảo mật: Xác nhận tab **Người dùng** bị ẩn hoàn toàn đối với vai trò Curator.
* **Kết quả kỳ vọng**:
  - Đăng nhập và truy cập giao diện quản trị thành công.
  - Phân quyền hoạt động chính xác, không hiển thị chức năng quản lý người dùng.

---

### Kịch bản 2: Quản lý sách & Tải ảnh bìa (Book Catalog Management)
* **Mục tiêu**: Đảm bảo Curator quản lý tốt thông tin sách, kiểm soát lỗi nhập liệu và kiểm tra chặn quyền xóa sách.
* **Các bước thực hiện**:
  1. Tại bảng quản trị, chọn tab **Quản lý sách**.
  2. Bấm nút **+ Thêm Sách Mới** để mở modal nhập liệu.
  3. Nhập thiếu thông tin (để trống tên sách hoặc tác giả) và nhấn nút lưu để kiểm tra các thông báo lỗi cảnh báo nhập liệu.
  4. Thử nhập giá sách âm (ví dụ: `-50000`) hoặc giá trị cực lớn vượt giới hạn để kiểm tra điều kiện validation.
  5. Nhập một sách mới hợp lệ, tải file ảnh bìa (JPG/PNG < 5MB) từ máy tính lên hệ thống (hoặc dán URL ảnh bìa) và nhấn **Thêm sách**.
  6. Thử chỉnh sửa thông tin cuốn sách vừa tạo và chuyển trạng thái từ **Công khai** sang **Tạm ẩn** để kiểm tra tính năng hiển thị.
  7. Thử bấm nút **Xóa** của một cuốn sách bất kỳ và kiểm tra phản hồi lỗi từ hệ thống.
* **Kết quả kỳ vọng**:
  - Hệ thống ngăn chặn và hiển thị rõ ràng các lỗi nhập liệu (bỏ trống tên/tác giả, giá trị âm, ảnh bìa quá lớn).
  - Thêm mới, sửa đổi thông tin sách và thay đổi trạng thái hoạt động chính xác.
  - Hành động xóa sách bị hệ thống chặn hoàn toàn với lỗi 403 Forbidden từ backend.

---

### Kịch bản 3: Quản lý Thể loại (Category Management)
* **Mục tiêu**: Thêm, sửa danh mục phân loại sách và xác minh giới hạn quyền xóa của Curator.
* **Các bước thực hiện**:
  1. Chọn tab **Quản lý thể loại**.
  2. Bấm **+ Thêm Thể loại**, nhập tên thể loại mới và bấm **Lưu**.
  3. Tìm thể loại vừa thêm, bấm **Sửa** để thay đổi tên hoặc mô tả rồi lưu lại.
  4. Xác nhận sự hiển thị của nút xóa: Đảm bảo nút **Xóa** thể loại bị ẩn hoàn toàn đối với tài khoản Curator.
* **Kết quả kỳ vọng**:
  - Thêm và sửa thể loại thành công, bảng cập nhật dữ liệu tức thì.
  - Không xuất hiện nút xóa thể loại trên giao diện của Curator.

---

### Kịch bản 4: Quản lý Mã giảm giá (Coupon Management)
* **Mục tiêu**: Quản lý các chiến dịch khuyến mãi bằng mã giảm giá theo phần trăm hoặc số tiền cố định.
* **Các bước thực hiện**:
  1. Chọn tab **Mã giảm giá**.
  2. Bấm **+ Tạo mã mới**.
  3. Tạo mã giảm giá theo phần trăm (ví dụ: `DISCOUNT10`, loại *Phần trăm*, giá trị *10*, giới hạn giảm tối đa và đơn tối thiểu).
  4. Tạo một mã giảm giá theo số tiền cố định (ví dụ: `FIXED50`, loại *Số tiền cố định*, giá trị *50000*).
  5. Thử nghiệm nhập ngày kết thúc trước ngày bắt đầu để kiểm tra chặn lỗi thời gian.
  6. Sử dụng công tắc **Bật/Tắt** để dừng hoặc kích hoạt lại một mã giảm giá.
  7. Xác nhận không hiển thị tùy chọn **Xóa** mã giảm giá đối với Curator.
* **Kết quả kỳ vọng**:
  - Tạo và cập nhật mã giảm giá thành công.
  - Các ràng buộc về logic (ngày bắt đầu/kết thúc, định dạng mã viết hoa không dấu) hoạt động tốt.
  - Quyền xóa mã giảm giá bị vô hiệu hóa đối với Curator.

---

### Kịch bản 5: Quản lý tồn kho và nhật ký biến động kho (Inventory Control)
* **Mục tiêu**: Điều chỉnh số lượng tồn kho vật lý và giám sát nhật ký thay đổi kho tự động.
* **Các bước thực hiện**:
  1. Chọn tab **Quản lý kho**.
  2. Tìm cuốn sách cần điều chỉnh tồn kho trong bảng hiển thị.
  3. Nhập số lượng mới vào ô số lượng sẵn có (thử nhập số lượng âm để kiểm tra chặn lỗi).
  4. Nhập lý do điều chỉnh và nhấn **Lưu**.
  5. Kéo xuống bảng **Nhật ký biến động kho** ở cuối trang để xác minh sự xuất hiện của dòng lịch sử ghi nhận điều chỉnh vừa rồi.
* **Kết quả kỳ vọng**:
  - Cập nhật số lượng sẵn có thành công, màu sắc cảnh báo số lượng (đỏ = hết hàng, vàng = sắp hết, xanh = sẵn sàng) thay đổi chính xác.
  - Nhật ký ghi lại chính xác thời gian, cuốn sách, loại thay đổi, số lượng chênh lệch, lý do và email của Curator thực hiện.

---

### Kịch bản 6: Tiếp nhận và xử lý tiến trình Đơn hàng (Order Processing)
* **Mục tiêu**: Kiểm thử luồng xử lý đơn hàng từ khi khách hàng đặt cho đến khi giao thành công hoặc hủy bỏ, đảm bảo số lượng tồn kho tự động đồng bộ chính xác.
* **Các bước thực hiện**:
  1. Chọn tab **Đơn hàng**.
  2. Sử dụng bộ lọc trạng thái để tìm kiếm đơn hàng mới đặt có trạng thái ban đầu là `PENDING` (Chờ xác nhận).
  3. Bấm xem chi tiết đơn hàng để kiểm tra danh sách sách, số lượng, địa chỉ giao nhận và tổng tiền.
  4. Bấm duyệt đơn hàng để chuyển trạng thái sang `CONFIRMED` (Đã xác nhận).
     - *Xác minh kho*: Truy cập tab **Quản lý kho** để xác nhận số lượng sách sẵn có tự động giảm và số lượng đã bán tăng tương ứng.
  5. Lần lượt cập nhật đơn hàng qua các bước tiếp theo: `CONFIRMED` -> `PACKAGING` -> `DELIVERING` -> `DELIVERED` (Đã giao thành công).
     - *Xác minh kho*: Kiểm tra kho không bị trừ lặp lại trong các bước sau.
  6. Thử nghiệm kịch bản hủy đơn hàng (chuyển sang `CANCELLED`):
     - Đối với đơn `PENDING` bị hủy: Kiểm tra lượng kho giữ chỗ (reserved) được giải phóng.
     - Đối với đơn `CONFIRMED` trở đi bị hủy: Kiểm tra kho sẵn có tự động cộng trả lại đầy đủ và nhật ký kho ghi nhận dòng "Hoàn hàng".
* **Kết quả kỳ vọng**:
  - Tiến trình trạng thái đơn hàng cập nhật mượt mà.
  - Số lượng tồn kho sẵn có, đang giữ và đã bán đồng bộ chính xác theo từng sự kiện duyệt đơn hoặc hủy đơn.

---

### Kịch bản 7: Đăng tải tài liệu & Vector hóa RAG (AI Indexing)
* **Mục tiêu**: Đăng tải tệp sách số hóa định dạng PDF để hệ thống phân tách nội dung và nạp vào cơ sở dữ liệu vector RAG.
* **Các bước thực hiện**:
  1. Chọn tab **Vector hóa RAG**.
  2. Tìm cuốn sách chưa được vector hóa trên bảng danh sách.
  3. Nhấn vào nút **Upload PDF** tương ứng.
  4. Chọn một file tài liệu bất kỳ không phải PDF (ví dụ: `.docx`, `.txt`) để kiểm tra cảnh báo định dạng file.
  5. Chọn một file PDF hợp lệ để upload lên hệ thống.
  6. Quan sát thanh tiến trình và thông báo trong khi hệ thống xử lý phân tích dữ liệu.
* **Kết quả kỳ vọng**:
  - Hệ thống từ chối tệp không đúng định dạng PDF.
  - Upload tệp PDF thành công, trạng thái chuyển sang hoàn tất và cập nhật thời gian "RAG Indexed At" tương ứng.
