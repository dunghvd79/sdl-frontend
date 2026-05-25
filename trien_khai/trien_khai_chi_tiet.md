# KẾ HOẠCH TRIỂN KHAI CHI TIẾT (TASK LIST)

Tài liệu này dùng để theo dõi tiến độ công việc redesign đồng bộ giao diện cho 5 trang lớn của **sdl-frontend**.

---

## 📅 Tiến Độ Triển Khai (Checklist)

- [x] **Phase 1: Redesign Trang Cá Nhân (`ProfilePage.jsx`)**
  - [x] Xóa bỏ toàn bộ Emoji ở tiêu đề và các nhãn.
  - [x] Chuyển layout sang 2 cột phẳng, bỏ shadow, bo góc lớn `rounded-2xl` -> `rounded-none`.
  - [x] Đổi kiểu dáng Avatar thành vòng tròn tinh tế, role badge thành viên nén `rounded-full` trung tính.
  - [x] Đồng bộ hóa kiểu dáng inputs (viền mảnh, focus cam đất, không bo góc).
  - [x] Đồng bộ hóa các buttons "Lưu thay đổi" & "Đổi mật khẩu" sang phẳng `rounded-none`, màu cam đất/đen than.
  - [x] Kiểm tra phản hồi cập nhật thông tin và cập nhật avatar/name trên Navbar ngay lập tức.

- [x] **Phase 2: Redesign Trang Xác Nhận Đơn Hàng (`CheckoutPage.jsx`)**
  - [x] Thay đổi tiêu đề in hoa Serif: `XÁC NHẬN ĐƠN HÀNG`.
  - [x] Tích hợp `useToast` từ `ToastContext` thay thế hàm `alert()` lỗi đặt hàng.
  - [x] Redesign danh sách sản phẩm thành dạng biên lai phẳng tối giản.
  - [x] Đồng bộ hóa khối tóm tắt đơn hàng (nền be nhạt, giá trị thanh toán cam đất).
  - [x] Chuyển khối chú thích PayGate sang dạng viền nét đứt (dashed border) tối giản.
  - [x] Đổi kiểu các nút điều hướng và thanh toán sang phẳng `rounded-none`.

- [x] **Phase 3: Redesign Trang Kết Quả Thanh Toán (`PaymentResultPage.jsx`)**
  - [x] Chuyển container thông báo thành phẳng `rounded-none` với viền mỏng.
  - [x] Thiết kế biểu tượng thành công (`✓`) và thất bại (`✗`) trong vòng tròn mảnh cam đất/xám đen.
  - [x] Đồng bộ hóa tiêu đề Serif và nội dung văn bản.
  - [x] Đổi kiểu dáng các nút điều hướng sang phẳng `rounded-none`.

- [x] **Phase 4: Redesign Trang Lịch Sử Đơn Hàng (`OrderHistoryPage.jsx`)**
  - [x] Thay thế hàm `alert()` lỗi tạo thanh toán bằng `toast.error()`.
  - [x] Định dạng lại các khối đơn hàng phẳng `rounded-none` kèm hiệu ứng hover nhẹ.
  - [x] Thiết kế các nhãn trạng thái (PAID, PENDING, CANCELLED) phẳng, viền mảnh.
  - [x] Thiết kế lại nút "Thanh toán ngay" và liên kết "Hỏi đáp AI" tối giản.

- [x] **Phase 5: Redesign Trang Quản Trị (`AdminDashboardPage.jsx`)**
  - [x] Xóa emoji, đổi tiêu đề thành Serif: `BẢNG QUẢN TRỊ`.
  - [x] Thiết kế lại thanh điều hướng Tab phẳng, tab active có gạch chân cam đất 2px.
  - [x] Định dạng lại toàn bộ Table ở tất cả các tab (Sách, Kho, Đơn hàng, Người dùng): header hoa font Sans, viền mảnh, hover hàng màu be cát.
  - [x] Đổi style tất cả các Selectbox cập nhật trạng thái/phân quyền người dùng sang phẳng `rounded-none`.
  - [x] Redesign Modal Thêm/Sửa sách: phẳng góc cạnh, đồng bộ input, checkbox thể loại.
  - [x] Thiết kế lại tab RAG Vector hóa: khối thống kê phẳng, nút upload và nút xử lý phẳng cam đất/đen than.

- [x] **Phase 6: Kiểm Thử Toàn Diện & Build**
  - [x] Kiểm tra toàn bộ luồng nghiệp vụ trên trình duyệt.
  - [x] Kiểm tra lỗi Console và kiểm soát lỗi UI.
  - [x] Đảm bảo dự án build thành công không lỗi bằng lệnh `npm run build`.

---

## 🛠️ Hướng Dẫn Thực Hiện

- Sử dụng các biến CSS được định nghĩa sẵn trong `src/index.css`:
  - Màu nền: `bg-surface` (`#ffffff`) hoặc `bg-surface-warm` (`#faf8f5`)
  - Màu viền: `border-divider` (`#e6e1da`)
  - Màu chữ: `text-ink` (`#1a1714`), `text-ink-light` (`#5c5650`)
  - Màu cam đất: `bg-primary` / `text-primary` (nếu có, hoặc dùng `#c56017`)
- Luôn giữ nguyên logic xử lý dữ liệu và API calls, chỉ thay đổi class CSS (Tailwind/văn bản thường) để cập nhật giao diện.
