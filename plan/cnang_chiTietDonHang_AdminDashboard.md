# Kế Hoạch Thêm Chi Tiết Đơn Hàng (Admin Order Details View)

Bổ sung tính năng hiển thị chi tiết đơn hàng trong tab "Đơn Hàng" của Bảng Quản Trị (`AdminDashboardPage.jsx`). Tính năng này giúp curator/admin có thể xem chi tiết thông tin đơn hàng bao gồm: khách hàng là ai, mua những sách gì, số lượng, giá của từng cuốn, tổng tiền, thời gian đặt hàng và cập nhật trạng thái đơn hàng.

## User Review Required

> [!IMPORTANT]
> **Điểm chính về thiết kế giao diện:**
> 1. **Phong cách Editorial:** Chi tiết đơn hàng sẽ hiển thị dưới dạng một Modal phẳng góc cạnh (`rounded-none`), không bóng đổ (`shadow-none`), viền mảnh (`border-divider`) và sử dụng tông màu chủ đạo Be cát & Cam đất (`#c56017`).
> 2. **Cập nhật trạng thái trực tiếp:** Trạng thái đơn hàng có thể được cập nhật ngay trong hộp thoại chi tiết và danh sách đơn hàng sẽ tự động đồng bộ hóa.

## Open Questions

> [!NOTE]
> 1. **Hiển thị danh sách:** Chúng tôi sẽ hiển thị chi tiết dưới dạng Modal để không làm loãng bảng danh sách chính. Nếu bạn thích hiển thị trực tiếp bằng cách mở rộng dòng (expandable row) ngay trong bảng, vui lòng phản hồi.

## Proposed Changes

### 1. Bảng Quản Trị (`AdminDashboardPage.jsx`)

#### [MODIFY] [AdminDashboardPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/AdminDashboardPage.jsx)
- Bổ sung state `selectedOrder` và `showDetailModal` vào sub-component `OrderManagerTab`.
- Thêm cột **Thao tác** vào bảng danh sách đơn hàng với nút **Chi tiết** phẳng (`rounded-none`, border mỏng).
- Phát triển hộp thoại Modal `Order Details` hiển thị:
  - Header: Mã đơn hàng (Serif), nút Đóng (✕).
  - Khung thông tin: Họ tên khách hàng, Email, Ngày đặt, Trạng thái (dropdown cập nhật nhanh).
  - Bảng biên lai tối giản: Tên sách (chấp nhận cả `title` và `bookTitle`), Đơn giá, Số lượng, Thành tiền.
  - Tổng số tiền: Nổi bật bằng màu cam đất `#c56017`.
  - Nút Đóng tối giản ở dưới cùng.

---

## Verification Plan

### Automated Tests
- Chạy lệnh build để kiểm tra lỗi cú pháp:
  ```powershell
  npm run build
  ```

### Manual Verification
- Khởi chạy dev server (`npm run dev`).
- Truy cập Bảng quản trị `/admin` -> Tab "Đơn Hàng".
- Bấm vào nút **Chi tiết** trên một đơn hàng bất kỳ.
- Kiểm tra xem Modal có hiển thị chính xác các trường:
  - Tên sách, Số lượng, Đơn giá, Thành tiền.
  - Tên khách hàng & Email.
  - Thời gian đặt & Tổng tiền.
- Cập nhật trạng thái trong Modal (ví dụ: chuyển từ `PENDING` sang `PAID`) và kiểm tra xem danh sách chính có cập nhật lại ngay lập tức.
