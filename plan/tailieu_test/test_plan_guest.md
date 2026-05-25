# Kế hoạch Kiểm thử: Vai trò Khách vãng lai (Guest - Chưa đăng nhập)

Kế hoạch này tập trung kiểm thử toàn bộ trải nghiệm người dùng vãng lai (chưa đăng nhập hệ thống), đặc biệt đối với phân hệ **Blog CMS** mới được phát triển và các luồng chức năng cơ bản của cửa hàng sách.

---

## Các kịch bản và bước kiểm thử chi tiết

### Kịch bản 1: Hiển thị danh sách "Bài viết nổi bật" trên Trang chủ
* **Mục tiêu**: Đảm bảo khách vãng lai thấy đúng tối đa 3 bài viết ở trạng thái `PUBLISHED` mới nhất, được tải động từ cơ sở dữ liệu.
* **Các bước thực hiện**:
  1. Mở trình duyệt ẩn danh (để đảm bảo không lưu session cũ) và truy cập Trang chủ `http://localhost:5173/` (hoặc cổng chạy dev server của bạn).
  2. Cuộn xuống phần **BÀI VIẾT NỔI BẬT** ở cuối trang.
  3. Kiểm tra xem số lượng bài viết hiển thị có đúng là tối đa 3 bài hay không.
  4. Đảm bảo giao diện tải mượt mà, hiển thị đầy đủ: Ảnh bìa, Tên chuyên mục (chữ in hoa màu xanh), Tiêu đề (chữ serif đậm), Tóm tắt ngắn, Ngày đăng và Thời gian đọc.
* **Kết quả kỳ vọng**:
  * Hiển thị đúng 3 bài viết đã seed trong database.
  * Các bài viết được sắp xếp theo thời gian tạo mới nhất lên trước.
  * Không có lỗi giao diện (mất ảnh hoặc vỡ khung).

---

### Kịch bản 2: Xem chi tiết bài viết (Article Detail Page)
* **Mục tiêu**: Đảm bảo khách vãng lai có thể click và đọc bài viết với giao diện đẹp mắt, đầy đủ nội dung.
* **Các bước thực hiện**:
  1. Tại phần **BÀI VIẾT NỔI BẬT**, click vào bài viết bất kỳ (click vào ảnh bìa hoặc tiêu đề).
  2. Kiểm tra thanh địa chỉ URL: Có chuyển sang dạng `/blog/[ID]` hay không (ví dụ: `/blog/1`).
  3. Xác thực các phần tử hiển thị trên trang chi tiết:
     * Tiêu đề lớn sang trọng.
     * Chuyên mục, Ngày đăng, Thời gian đọc.
     * Khung tóm tắt (màu nền nhạt có đường viền đứng bên trái).
     * Ảnh bìa lớn sắc nét.
     * Nội dung bài viết chi tiết được căn lề đều, ngắt đoạn rõ ràng.
  4. Bấm nút **"← Quay lại Góc đọc sách"** ở góc trên cùng của bài viết.
* **Kết quả kỳ vọng**:
  * Chuyển trang mượt mà, hiển thị đúng và đủ thông tin bài viết.
  * Khi bấm quay lại, trình duyệt tự động chuyển về Trang chủ và cuộn mượt xuống đúng vị trí phần **BÀI VIẾT NỔI BẬT** (`#blog`).

---

### Kịch bản 3: Đảm bảo bảo mật & Quyền riêng tư (Không hiển thị Bản nháp/Tạm ẩn)
* **Mục tiêu**: Khách vãng lai tuyệt đối không được nhìn thấy hoặc truy cập các bài viết ở trạng thái `DRAFT` hoặc `HIDDEN`.
* **Các bước thực hiện**:
  1. Thử truy cập trực tiếp bằng URL vào một ID bài viết giả định có trạng thái ẩn (nếu biết ID, hoặc nhập một ID lớn hơn 3).
  2. Kiểm tra xem hệ thống có hiển thị trang lỗi "Không tìm thấy bài viết" hay không.
* **Kết quả kỳ vọng**:
  * Trang chủ chỉ hiển thị các bài viết `PUBLISHED`.
  * Các bài viết ở trạng thái `DRAFT` hoặc `HIDDEN` khi truy cập trực tiếp bằng đường dẫn phải trả về lỗi `404 - Không tìm thấy` từ Backend để tránh rò rỉ thông tin.

---

### Kịch bản 4: Đảm bảo bảo mật các cổng Admin/Curator
* **Mục tiêu**: Khách vãng lai không được phép truy cập vào trang quản trị hoặc thực thi bất kỳ thao tác thay đổi dữ liệu nào.
* **Các bước thực hiện**:
  1. Cố tình gõ trực tiếp URL quản trị trên thanh địa chỉ: `http://localhost:5173/admin`.
  2. Thử gửi các yêu cầu giả lập REST API đến các endpoint quản trị:
     * `POST /api/articles` (Tạo bài viết)
     * `PUT /api/articles/1` (Cập nhật bài viết)
     * `DELETE /api/articles/1` (Xóa bài viết)
* **Kết quả kỳ vọng**:
  * Khi vào `/admin`, khách vãng lai phải lập tức bị hệ thống chặn và chuyển hướng quay trở lại trang đăng nhập `/login` hoặc hiển thị thông báo không đủ quyền.
  * Các API thay đổi dữ liệu khi không kèm Token hợp lệ phải trả về mã lỗi `401 Unauthorized` hoặc `403 Forbidden`.

---

## Kế hoạch hành động tiếp theo
1. **Bạn duyệt kế hoạch kiểm thử này**: Nếu bạn đồng ý với các kịch bản trên, tôi sẽ bắt đầu hướng dẫn bạn chạy thử nghiệm và kiểm tra chi tiết phản hồi từ hệ thống.
2. **Tiến hành kiểm thử**: Chúng ta sẽ cùng nhau thực hiện từng kịch bản và ghi nhận kết quả.
