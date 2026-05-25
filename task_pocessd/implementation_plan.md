# Kế hoạch triển khai: Hoàn thiện Frontend cho Smart Digital Library (SDL)

Dựa trên việc đối chiếu cấu trúc dự án thực tế và các tài liệu trong thư mục `plan`, đây là báo cáo hiện trạng chi tiết và lộ trình hoàn thiện các tính năng Frontend tiếp theo.

---

## 📊 1. Đánh giá Hiện trạng Dự án

Hiện tại dự án đang ở **Tuần 2 (Week 2 - Core Pages)** của kế hoạch `SDL_FRONTEND_PLAN.md`.

### Những phần đã làm tốt:
1. **Cấu trúc & Thư viện cơ bản:** Đã cài đặt xong React + Vite + TailwindCSS + React Query + React Router.
2. **Quản lý trạng thái toàn cục (Context):** 
   - `AuthContext.jsx` đã quản lý được phiên đăng nhập của người dùng.
   - `CartContext.jsx` đã quản lý được số lượng giỏ hàng (`cartCount`).
3. **Các Component cốt lõi:**
   - `Navbar.jsx` hiển thị đầy đủ thông tin tùy theo trạng thái đăng nhập.
   - `BookCard.jsx` hiển thị thông tin sách và nút Thêm vào giỏ.
4. **Đăng nhập (`LoginPage.jsx`):** Form đăng nhập hoàn chỉnh, tích hợp tốt với `AuthContext` và quản lý các trạng thái loading/error.
5. **Cấu hình Axios (`src/services/api.js`):** Đã tạo Axios Instance tập trung với Base URL và Interceptor tự động đính kèm Token.

### Những điểm cần khắc phục và thiếu sót:
1. **Lỗi nhầm lẫn file (`RegisterPage.jsx`):** File này hiện đang chứa mã nguồn trang chủ thử nghiệm (chức năng tìm kiếm, danh sách sách). Cần chuyển logic này sang đúng file `HomePage.jsx` và viết lại form Đăng ký thực tế cho `RegisterPage.jsx`.
2. **Khai báo router tạm thời:** Trong `App.jsx`, các trang `RegisterPage` và `CartPage` đang được khai báo tạm bằng arrow function thay vì import file thật.
3. **Sử dụng Axios chưa đồng bộ:** Các file `AuthContext.jsx`, `CartContext.jsx` và `HomePage.jsx` vẫn đang sử dụng thư viện `axios` mặc định và tự đính kèm token thủ công, chưa tận dụng file cấu hình tập trung `services/api.js`.
4. **Thiếu các trang cốt lõi:**
   - Trang Đăng ký người dùng (`RegisterPage.jsx`).
   - Trang Chi tiết sách (`BookDetailPage.jsx`).
   - Trang Giỏ hàng (`CartPage.jsx`).
   - Trang Chat với Sách bằng AI RAG (`ChatPage.jsx`).

---

## 🛡️ 2. Yêu cầu Người dùng Duyệt (User Review Required)

> [!WARNING]
> **Nhầm lẫn ở file `RegisterPage.jsx`:**
> Tôi sẽ di chuyển toàn bộ logic hiển thị sách và tìm kiếm hiện tại từ file [RegisterPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/RegisterPage.jsx) sang file [HomePage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/HomePage.jsx). Sau đó, tôi sẽ ghi đè file [RegisterPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/RegisterPage.jsx) bằng Form Đăng Ký tài khoản thực sự.

> [!IMPORTANT]
> **Đồng bộ hóa Axios:**
> Tôi sẽ cập nhật các file [AuthContext.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/context/AuthContext.jsx) và [CartContext.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/context/CartContext.jsx) để chuyển sang dùng `api` từ `src/services/api.js`, giúp loại bỏ việc viết lặp đi lặp lại mã `Authorization: Bearer ...` và `import.meta.env.VITE_API_URL`.

---

## 📋 3. Kế hoạch chi tiết cho các bước tiếp theo

Kế hoạch được chia thành 4 bước chính:

### Bước 1: Dọn dẹp & Tối ưu hóa hệ thống hiện tại
* **[MODIFY]** [HomePage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/HomePage.jsx): Cập nhật giao diện có thanh Tìm kiếm (như trong RegisterPage cũ) và chuyển sang dùng `services/api.js` để fetch dữ liệu.
* **[MODIFY]** [RegisterPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/RegisterPage.jsx): Thay thế toàn bộ bằng Form Đăng ký tài khoản (`fullName`, `email`, `password`, `confirmPassword`).
* **[MODIFY]** [AuthContext.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/context/AuthContext.jsx) & [CartContext.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/context/CartContext.jsx): Chuyển sang import `api` từ `services/api.js`.
* **[MODIFY]** [App.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/App.jsx): Import file `RegisterPage.jsx` thật thay vì khai báo component giả lập.

### Bước 2: Xây dựng trang Chi tiết sách (`BookDetailPage.jsx`)
* **[NEW]** [BookDetailPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/BookDetailPage.jsx):
  * Lấy thông tin sách dựa trên `id` từ URL (sử dụng `useParams`).
  * Hiển thị mô tả chi tiết sách, tác giả, giá tiền, số lượng tồn kho.
  * Tích hợp nút **"Thêm vào giỏ"** và nút **"Trò chuyện cùng sách (AI Chat)"** (nếu người dùng đã mua hoặc có quyền đọc).

### Bước 3: Xây dựng trang Giỏ hàng hoàn chỉnh (`CartPage.jsx`)
* **[MODIFY]** `App.jsx` (Import CartPage thật).
* **[NEW]** [CartPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/CartPage.jsx):
  * Gọi API lấy danh sách sản phẩm trong giỏ của User qua `CartContext` hoặc `cartService`.
  * Hiển thị danh sách dạng bảng/danh sách (ảnh sách, tên sách, số lượng, giá tiền).
  * Chức năng tăng/giảm số lượng trực tiếp và nút **Xóa** sản phẩm khỏi giỏ.
  * Tính tổng tiền và nút **"Tiến hành Thanh toán"** (Checkout).

### Bước 4: Xây dựng trang Chat AI RAG (`ChatPage.jsx`)
* **[NEW]** [ChatPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/ChatPage.jsx):
  * Giao diện Chat phân đôi hoặc full màn hình chuyên nghiệp: Bên trái là thông tin cuốn sách, bên phải là khung chat.
  * Sử dụng state để hiển thị lịch sử tin nhắn (`messages`).
  * Nút gửi tin nhắn kết nối với API `/chat/ask` (gửi `bookId` và `query` lên backend AI FastAPI).
  * Hiển thị danh sách nguồn trích dẫn (`sources` - trang sách, đoạn văn) dưới câu trả lời của AI để tăng tính xác thực.

---

## 🔬 4. Kế hoạch Xác minh & Kiểm thử (Verification Plan)

### Kiểm thử Tự động & Kết nối:
1. Chạy lệnh phát triển: `npm run dev` để đảm bảo không lỗi biên dịch Vite.
2. Kiểm tra log console của trình duyệt không phát sinh các lỗi import sai đường dẫn.
3. Kiểm tra tính năng xác thực: Đăng ký tài khoản mới -> Đăng nhập -> Token được lưu tự động vào `localStorage`.

### Kiểm thử Thủ công trên Giao diện:
1. **Tìm kiếm:** Gõ từ khóa ở trang chủ và xác nhận danh sách sách tự động lọc tương ứng.
2. **Giỏ hàng:** Bấm "Thêm vào giỏ" ở Trang chủ/Chi tiết sách -> Badge số lượng trên Navbar tăng lên lập tức -> Vào trang Giỏ hàng kiểm tra danh sách.
3. **Chat AI:** Vào trang Chat, nhập câu hỏi thử nghiệm và quan sát trạng thái Loading (AI đang trả lời...) trước khi tin nhắn của AI xuất hiện kèm nguồn trích dẫn.
