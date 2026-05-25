# Kế hoạch triển khai: Hoàn thiện luồng Đặt hàng & Thanh toán giả lập (Phase 5 & 6)

Để hoàn tất luồng nghiệp vụ E-commerce của dự án Smart Digital Library, chúng ta cần liên kết tính năng **Khóa kho giỏ hàng** hiện tại với việc **Tạo Đơn hàng** và **Thanh toán qua cổng VNPay giả lập**.

---

## 🛡️ Yêu cầu Người dùng Duyệt (User Review Required)

> [!IMPORTANT]
> **Cổng thanh toán giả lập (Mock Gateway) trên Node.js:**
> Hiện tại, URL thanh toán do Service sinh ra hướng tới `http://localhost:3000/mock-gateway?...`. Tuy nhiên, phía Node.js Backend chưa khai báo route này nên người dùng sẽ gặp lỗi 404 khi được chuyển hướng. 
> Tôi đề xuất bổ sung thêm một route trả về trang HTML đơn giản của cổng thanh toán giả lập ngay trên Node.js Backend (port 3000). Trang này cho phép người dùng click chọn "Thành công" hoặc "Thất bại" để kích hoạt Webhook cập nhật đơn hàng.

---

## 📋 Đề xuất Thay đổi (Proposed Changes)

Kế hoạch hoàn thiện được chia thành các file cụ thể như sau:

### 1. Phía Backend (Node.js Express)

#### [MODIFY] [app.js](file:///E:/sdl-project/src/config/app.js) hoặc [payments.js](file:///E:/sdl-project/src/routes/payments.js)
* Thêm route `GET /mock-gateway` để phục vụ trang giao diện Cổng thanh toán giả lập (Mock VNPay).
* Trang HTML này nhận các tham số `orderId`, `amount`, `paymentId` từ query string, hiển thị thông tin và có 2 nút:
  * **Xác nhận Thanh toán Thành công:** Gửi request POST tới `/api/payments/webhook` với trạng thái `SUCCESS`.
  * **Hủy Giao dịch / Thất bại:** Gửi request POST tới `/api/payments/webhook` với trạng thái `FAILED`.
  * Sau khi gửi webhook xong, trang HTML sẽ tự động chuyển hướng người dùng quay lại Frontend (`http://localhost:5173/payment-result?status=success` hoặc `fail`).

---

### 2. Phía Frontend (Vite React)

#### [NEW] [CheckoutPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/CheckoutPage.jsx)
* Cho phép người dùng soát lại danh sách sách đang mua, tổng số tiền.
* Cung cấp nút **"Đặt hàng & Thanh toán"**. Khi click:
  1. Gọi API `POST /api/orders/checkout` để chốt đơn hàng và làm sạch giỏ hàng.
  2. Gọi tiếp API `GET /api/payments/url/:orderId` để nhận URL thanh toán từ Backend.
  3. Chuyển hướng trình duyệt (`window.location.href`) sang trang Mock Gateway.

#### [NEW] [PaymentResultPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/PaymentResultPage.jsx)
* Trang đích nhận chuyển hướng từ cổng thanh toán.
* Đọc query parameter `status` từ URL.
* Hiển thị trạng thái giao dịch đẹp mắt:
  * Nếu thành công: Báo mua sách thành công và nút chuyển sang trang đọc sách / lịch sử đơn hàng.
  * Nếu thất bại: Báo lỗi thanh toán và gợi ý thử lại.

#### [NEW] [OrderHistoryPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/OrderHistoryPage.jsx)
* Lấy lịch sử mua hàng từ API `GET /api/orders` bằng React Query.
* Hiển thị danh sách các đơn hàng đã đặt kèm mã đơn, thời gian, danh sách sách mua, tổng số tiền và trạng thái đơn hàng (`PENDING`, `PAID`, `FAILED`).
* Với đơn hàng `PENDING` (chưa thanh toán), hiển thị nút **"Thanh toán ngay"** để lấy lại link thanh toán và tiếp tục thanh toán.

#### [MODIFY] [CartPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/CartPage.jsx)
* Cập nhật hàm `onSuccess` của `checkoutMutation`: thay vì `navigate('/')`, ta chuyển hướng sang `/checkout` để khách tiến hành chốt hóa đơn.

#### [MODIFY] [App.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/App.jsx)
* Đăng ký các Route mới:
  * `/checkout` -> `CheckoutPage`
  * `/payment-result` -> `PaymentResultPage`
  * `/orders` -> `OrderHistoryPage`

#### [MODIFY] [Navbar.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/components/Navbar.jsx)
* Thêm nút **"Đơn hàng của tôi"** ở thanh điều hướng khi User đã đăng nhập để dễ dàng xem lịch sử.

---

## 🔬 Kế hoạch Xác minh & Kiểm thử (Verification Plan)

1. **Kiểm thử Luồng Đặt hàng:**
   * Thêm sách vào giỏ hàng -> Click "Tiến hành Thanh toán" -> Chuyển sang trang Xác nhận đơn hàng.
   * Tại trang xác nhận đơn hàng, click "Đặt hàng & Thanh toán" -> Chuyển hướng sang trang cổng thanh toán VNPay giả lập.
2. **Kiểm thử Cổng Thanh toán (Thành công):**
   * Tại cổng thanh toán, click "Xác nhận Thanh toán Thành công" -> Hệ thống gọi Webhook cập nhật đơn hàng thành `PAID` -> Chuyển hướng về trang Kết quả với thông báo thành công.
   * Kiểm tra giỏ hàng đã được làm sạch và trang Đơn hàng hiển thị đơn hàng ở trạng thái `PAID`.
3. **Kiểm thử Cổng Thanh toán (Thất bại / Hủy):**
   * Tại cổng thanh toán, click "Hủy" -> Đơn hàng vẫn giữ trạng thái `PENDING` -> Chuyển về Frontend báo thất bại -> Vào trang Đơn hàng và click "Thanh toán ngay" để tiếp tục thanh toán lại.
