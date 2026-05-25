# Danh sách tác vụ triển khai (Task List)

## Bước 1: Dọn dẹp & Tối ưu hóa hệ thống hiện tại
- [x] Chuyển logic tìm kiếm từ `RegisterPage.jsx` sang `HomePage.jsx`
- [x] Viết lại Form Đăng ký thực tế cho `RegisterPage.jsx`
- [x] Đồng bộ hóa Axios trong `AuthContext.jsx` để dùng `api.js` tập trung
- [x] Đồng bộ hóa Axios trong `CartContext.jsx` để dùng `api.js` tập trung
- [x] Đồng bộ hóa Axios trong `HomePage.jsx` để dùng `api.js` tập trung
- [x] Cập nhật `App.jsx` để import `RegisterPage.jsx` thật và dọn dẹp các import không dùng

## Bước 2: Xây dựng trang Chi tiết sách (`BookDetailPage.jsx`)
- [x] Tạo file `BookDetailPage.jsx` mới trong `src/pages`
- [x] Lấy chi tiết sách qua `api.get('/books/:id')` bằng React Query
- [x] Thiết kế giao diện chi tiết sách đẹp, hiện đại (nút thêm giỏ hàng, nút chat AI)
- [x] Cấu hình Route cho `/books/:id` trong `App.jsx`

## Bước 3: Xây dựng trang Giỏ hàng (`CartPage.jsx`)
- [x] Tạo file `CartPage.jsx` mới trong `src/pages`
- [x] Gọi API hiển thị danh sách giỏ hàng, số lượng và tổng tiền từ Context/Server
- [x] Xử lý tăng/giảm số lượng và xóa sản phẩm khỏi giỏ hàng
- [x] Cập nhật `App.jsx` để liên kết `CartPage` thực tế vào Route `/cart`

## Bước 4: Xây dựng trang Chat AI RAG (`ChatPage.jsx`)
- [x] Tạo file `ChatPage.jsx` mới trong `src/pages`
- [x] Xây dựng giao diện chat mượt mà, hỗ trợ tự cuộn xuống (Auto-scroll), hiển thị trạng thái đang nhập liệu
- [x] Kết nối API `/chat/ask` (gửi request và nhận câu trả lời cùng nguồn trích dẫn `sources`)
- [x] Cấu hình Route `/books/:id/chat` trong `App.jsx`
