# KẾ HOẠCH ĐỒNG BỘ THIẾT KẾ CÁC TRANG LỚN (EDITORIAL DESIGN SYSTEM)

Tài liệu này chi tiết hóa kế hoạch nâng cấp, tái cấu trúc và đồng bộ hóa giao diện của 5 trang lớn còn lại trong ứng dụng **Smart Digital Library (sdl-frontend)** sang ngôn ngữ thiết kế **Editorial / Minimalist** (Be cát làm nền, mực đen cho chữ, màu cam đất làm điểm nhấn và hình khối phẳng góc cạnh).

---

## 🎨 Nguyên Tắc Thiết Kế Áp Dụng (Design System Rules)

1. **Màu sắc chính**:
   - Nền trang: `#faf8f5` (Be cát ấm áp) hoặc trắng giấy ngà.
   - Nền container chính: `#ffffff` hoặc `#fcfbf9` (màu trắng ngà tinh tế).
   - Màu chữ chính (Ink): `#1a1714` (Đen than).
   - Màu chữ phụ (Ink/70 hoặc Gray): `#5c5650` (Xám ấm).
   - Màu nhấn thương hiệu: `#c56017` (Cam đất nung / Clay Orange).
   - Màu viền (Divider): `#e6e1da` hoặc `#e5e7eb` (Xám cát siêu mảnh 1px).

2. **Hình khối & Cấu trúc (Layout & Shapes)**:
   - **Tuyệt đối phẳng**: Thay thế tất cả `rounded-2xl`, `rounded-xl`, `rounded-lg` thành `rounded-none` (hoặc `rounded-full` độc quyền cho Avatar và Profile Pill/Badge như đã thống nhất).
   - **Không bóng đổ (No Shadow)**: Đưa `shadow-sm`, `shadow-md`, `shadow-lg` về `shadow-none`, định hình cấu trúc bằng các đường kẻ mảnh 1px (`border-[1px] border-divider`).

3. **Typography**:
   - Tiêu đề lớn (H1, H2): Font Serif (`font-serif`, ví dụ: Playfair Display) để tạo cảm giác bìa sách/báo chí trang trọng.
   - Văn bản và meta-data: Font Sans-serif (`font-sans`, ví dụ: Inter) mỏng, gọn gàng.

4. **Loại bỏ Emoji**:
   - Loại bỏ các biểu tượng emoji lòe loẹt ở tiêu đề các trang (Ví dụ: `👤 Hồ sơ`, `📝 Xác nhận`, `📂 Đơn hàng`, `⚙️ Bảng quản trị`).

5. **Trải nghiệm lập trình (UX/Functional)**:
   - Thay thế toàn bộ các hàm thông báo thô sơ `alert()` bằng hệ thống thông báo Toast chuyên nghiệp thông qua `useToast()` có sẵn trong dự án.

---

## 📋 Chi Tiết Kế Hoạch Cho Từng Trang Lớn

### 1. Trang Cá Nhân (`ProfilePage.jsx`)
- **Vị trí**: [ProfilePage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/ProfilePage.jsx)
- **Thiết kế hiện tại**: Bo góc tròn `rounded-2xl`, bóng đổ dày, nền xanh dương và role badge màu sắc rực rỡ, sử dụng emoji.
- **Phương án Redesign**:
  - Bố cục 2 cột dạng tạp chí.
  - **Cột trái (Tổng quan)**: 
    - Avatar hình tròn tinh tế với viền mỏng.
    - Role badge chuyển thành dạng "viên nén" (`rounded-full`) màu nền trung tính `#f0ece7`, viền mảnh.
  - **Cột phải (Biểu mẫu thông tin & Đổi mật khẩu)**:
    - Phân chia 2 phần rõ rệt bằng đường kẻ mảnh ngang, nền container trắng phẳng `rounded-none` với viền `border-divider`.
    - Toàn bộ ô nhập liệu (Input) đổi sang `rounded-none`, border xám mảnh. Khi focus, đổi màu viền sang màu cam đất `#c56017` hoặc mực `#1a1714` (loại bỏ viền xanh dương mặc định).
    - Nút bấm "Lưu thay đổi" và "Đổi mật khẩu" chuyển sang phẳng `rounded-none`, màu cam đất nung hoặc màu mực đen.

---

### 2. Trang Xác Nhận Đơn Hàng (`CheckoutPage.jsx`)
- **Vị trí**: [CheckoutPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/CheckoutPage.jsx)
- **Thiết kế hiện tại**: Nhiều hộp bo góc lớn, màu sắc tóm tắt xanh dương/xanh lá, nút thanh toán dùng gradient xanh tím. Có dùng hàm `alert()` mặc định của trình duyệt khi lỗi.
- **Phương án Redesign**:
  - Tiêu đề in hoa font Serif trang trọng: `XÁC NHẬN ĐƠN HÀNG`.
  - Thay thế hàm `alert()` lỗi đặt hàng bằng `toast.error()` từ `ToastContext`.
  - Danh sách sản phẩm thanh toán thiết kế phẳng, viền ngăn cách mảnh dạng biên nhận tạp chí.
  - Phần tóm tắt thanh toán: Nền be ấm nhạt, font số tiền lớn màu cam đất để nhấn mạnh.
  - Phần chú ý PayGate: Đổi từ box xanh dương lòe loẹt sang khung viền nét đứt (dashed border) màu be sẫm cực kỳ tinh giản.
  - Các nút bấm: Nút "Quay lại" dùng viền mảnh chữ xám đen, nút "Đặt hàng & Thanh toán" dùng màu nhấn cam đất phẳng hoàn toàn `rounded-none` (loại bỏ gradient).

---

### 3. Trang Lịch Sử Đơn Hàng (`OrderHistoryPage.jsx`)
- **Vị trí**: [OrderHistoryPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/OrderHistoryPage.jsx)
- **Thiết kế hiện tại**: Khung bo tròn, bóng đổ, trạng thái badge dạng bầu dục bóng màu xanh/đỏ/vàng. Dùng hàm `alert()` khi lỗi tạo thanh toán.
- **Phương án Redesign**:
  - Thay thế hàm `alert()` bằng `toast.error()`.
  - Thiết kế các khối đơn hàng phẳng `rounded-none` với viền mảnh. Khi hover vào đơn hàng, tạo hiệu ứng chuyển nền be cát nhẹ nhàng rất tinh tế.
  - Các nhãn trạng thái (Badge status) phẳng vuông vức `rounded-none` với viền mảnh:
    - **PAID**: Viền xanh lá sẫm nhạt, chữ xanh lá, nền rất nhạt hoặc trong suốt.
    - **PENDING**: Viền màu cam đất nhạt, chữ cam đất, kèm hiệu ứng nhấp nháy (pulse) mượt mà.
    - **CANCELLED**: Viền màu xám than nhạt, chữ xám đen.
  - Nút "Thanh toán ngay": Đổi sang màu cam đất nung phẳng `rounded-none`.
  - Nút "Hỏi đáp AI": Chuyển thành link/nút nhỏ thanh mảnh với font chữ in hoa, không bo góc.

---

### 4. Trang Kết Quả Thanh Toán (`PaymentResultPage.jsx`)
- **Vị trí**: [PaymentResultPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/PaymentResultPage.jsx)
- **Thiết kế hiện tại**: Vòng tròn tích xanh/đỏ bóng đổ chuyển động hoạt họa lớn, nút bấm bo tròn xanh dương.
- **Phương án Redesign**:
  - Container chính phẳng hoàn toàn `rounded-none`, viền mỏng.
  - Biểu tượng thành công (`✓`) và thất bại (`✗`) đặt trong vòng tròn nét vẽ mảnh màu cam đất (cho thành công) hoặc màu xám đậm (cho thất bại).
  - Tiêu đề Serif lớn thể hiện trạng thái trang nghiêm.
  - Nút bấm điều hướng ("Xem Đơn Hàng Của Tôi", "Quay lại Trang Chủ") phẳng `rounded-none` với tông màu tương phản mạnh (Đen mực và Be nhạt viền đen).

---

### 5. Trang Quản Trị Phức Tạp (`AdminDashboardPage.jsx`)
- **Vị trí**: [AdminDashboardPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/AdminDashboardPage.jsx)
- **Thiết kế hiện tại**: Hơn 800 dòng code, bao gồm 5 tab quản lý con sử dụng các bảng biểu bo góc tròn, bóng đổ, nút bấm sặc sỡ, form modal thô sơ.
- **Phương án Redesign**:
  - **Tiêu đề & Layout chính**: Tiêu đề Serif lớn `BẢNG QUẢN TRỊ`, bỏ emoji.
  - **Thanh điều hướng Tab (Tab Navigation)**: Chuyển các tab bo góc thành dạng tab tối giản phẳng hoàn toàn. Tab đang chọn có đường gạch chân màu cam đất 2px và chữ màu cam đất nổi bật.
  - **Khung nội dung**: `rounded-none`, `shadow-none`, border mỏng.
  - **Bảng biểu (Tables)**:
    - Header bảng viết hoa (`text-xs uppercase tracking-wider`), màu xám nhạt, font Sans gọn gàng.
    - Đường kẻ dòng siêu mảnh.
    - Hover dòng đổi sang be cát nhẹ `bg-[#fcfbf9]/70`.
    - Toàn bộ selectbox cập nhật trạng thái đơn hàng/role người dùng đổi thành `rounded-none`, border mảnh, loại bỏ bóng đổ.
  - **Form Modal (Thêm/Sửa Sách)**:
    - Hộp thoại modal phẳng hoàn toàn `rounded-none`, bóng đổ mờ rộng hoặc không bóng (chỉ border đen/be dày).
    - Các ô nhập liệu đồng bộ phẳng.
    - Checkbox thể loại sách thiết kế phẳng vuông vắn, không bo góc.
  - **Vector hóa tài liệu RAG**:
    - Khối thống kê: Đổi thành các ô vuông phẳng `rounded-none` viền mảnh, con số thống kê to đậm font Serif.
    - Nút "Vector hóa" đổi từ màu xanh/tím sang màu cam đất/đen than phẳng.

---

## 📈 Kế Hoạch Xác Minh (Verification Plan)

1. **Khảo sát giao diện**: Chạy ứng dụng locally và duyệt qua từng trang lớn đã được cập nhật để kiểm chứng độ đồng đều thẩm mỹ.
2. **Kiểm thử phản hồi nghiệp vụ**: 
   - Đổi mật khẩu trong trang cá nhân, cập nhật tên -> xác minh xem navbar cập nhật ngay lập tức không.
   - Tạo đơn hàng -> sang trang cổng thanh toán giả lập -> quay lại trang kết quả -> kiểm tra lịch sử đơn hàng.
   - Thao tác quản trị trong Admin Dashboard (thêm sách mới, cập nhật tồn kho, thay đổi trạng thái đơn hàng) để đảm bảo không xảy ra lỗi logic nào.
3. **Kiểm thử Toast**: Kích hoạt các tình huống lỗi hoặc thành công để xem Toast hiển thị thay cho các hàm `alert()` mặc định.
4. **Kiểm thử Build**: Chạy lệnh `npm run build` để đảm bảo toàn bộ mã nguồn biên dịch thành công, không gặp bất kỳ lỗi cú pháp hay lint nào.
