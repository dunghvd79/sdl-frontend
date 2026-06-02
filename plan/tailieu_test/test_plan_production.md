# Kế hoạch Kiểm thử Toàn diện Sau Khi Deploy Production
## Smart Digital Library — Netlify + Render + PostgreSQL Cloud

> **URL Production**: [https://pigeon-bookstore.netlify.app](https://pigeon-bookstore.netlify.app)
> **Thời gian kiểm thử**: _______________
> **Người kiểm thử**: _______________
> **Ghi chú**: Thực hiện toàn bộ kiểm thử trên URL Production, KHÔNG dùng localhost.

---

## Thông tin Tài khoản Thử nghiệm

| Vai trò | Email | Mật khẩu | Quyền hạn |
|---------|-------|----------|-----------|
| Quản trị viên | `admin@test.vn` | `pasword123` | Toàn quyền |
| Thủ thư | `curator@test.vn` | `pasword123` | Quản lý nội dung, kho, đơn hàng |
| Khách hàng | `customer@test.vn` | `pasword123` | Mua sách, giỏ hàng, thanh toán |

---

## PHẦN 1: KHÁCH VÃNG LAI (Guest — Chưa đăng nhập)

### [TC-G-01] Truy cập Trang chủ cơ bản
- [ ] Truy cập `https://pigeon-bookstore.netlify.app` trong chế độ ẩn danh (Incognito).
- [ ] Trang tải thành công, không hiển thị hộp lỗi màu đỏ "Lỗi kết nối Cơ sở dữ liệu".
- [ ] Danh sách sách xuất hiện đầy đủ với ảnh bìa, tên sách, tác giả, giá.
- [ ] Phần **BÀI VIẾT NỔI BẬT** hiển thị tối đa 3 bài viết ở cuối trang.
- [ ] Navbar hiển thị đúng: Logo, menu điều hướng, nút **Đăng nhập** và **Đăng ký**.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-G-02] Tìm kiếm & Lọc sách
- [ ] Gõ từ khóa tìm kiếm (ví dụ: "Harry", "Clean Code") vào thanh tìm kiếm.
- [ ] Danh sách sách lọc kết quả phù hợp theo thời gian thực (sau ~350ms debounce).
- [ ] Nhấn vào một **Thể loại** ở bộ lọc (ví dụ: "Kinh dị") — danh sách lọc chính xác.
- [ ] Kéo thanh trượt **Giá tối đa** về giá trị thấp — danh sách cập nhật đúng.
- [ ] Thử bộ lọc **Sắp xếp**: Mới nhất / Cũ nhất / Giá tăng dần / Giá giảm dần.
- [ ] Khi không có kết quả, hệ thống hiển thị thông báo "Không tìm thấy kết quả" và gợi ý sách thay thế.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-G-03] Xem chi tiết Sách
- [ ] Click vào một cuốn sách bất kỳ để mở trang chi tiết.
- [ ] URL chuyển sang dạng `/books/[id]`.
- [ ] Hiển thị đầy đủ: Tên, tác giả, mô tả, giá, ảnh bìa, thể loại, số lượng tồn kho.
- [ ] Nút **Thêm vào giỏ hàng** hiển thị — khi nhấn phải chuyển hướng sang trang Đăng nhập (vì chưa có tài khoản).
- [ ] Nút **Yêu thích** (trái tim) khi nhấn phải chuyển hướng sang trang Đăng nhập.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-G-04] Đọc bài viết Blog
- [ ] Click vào một bài viết ở phần **BÀI VIẾT NỔI BẬT** trang chủ.
- [ ] URL chuyển sang dạng `/blog/[id]`.
- [ ] Hiển thị đầy đủ: Ảnh bìa lớn, chuyên mục, ngày đăng, thời gian đọc, tóm tắt, nội dung bài viết.
- [ ] Nhấn nút **← Quay lại Góc đọc sách** — chuyển về trang chủ và cuộn xuống đúng phần blog.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-G-05] Bảo mật — Không cho phép truy cập khu vực quản trị
- [ ] Gõ trực tiếp URL `/admin` vào thanh địa chỉ.
- [ ] Hệ thống chặn và chuyển hướng về trang `/login`.
- [ ] Gõ trực tiếp URL `/cart` — phải chuyển hướng về `/login`.
- [ ] Gõ trực tiếp URL `/orders` — phải chuyển hướng về `/login`.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-G-06] Đăng ký tài khoản mới
- [ ] Click **Đăng ký** trên Navbar.
- [ ] Điền đầy đủ thông tin: Họ tên, Email mới (không dùng email đã có), Mật khẩu (ít nhất 6 ký tự), xác nhận mật khẩu.
- [ ] Nhấn **Đăng ký** — hệ thống tạo tài khoản thành công, tự động đăng nhập và chuyển về trang chủ.
- [ ] Kiểm tra trường hợp lỗi: Để trống email, nhập mật khẩu không khớp, dùng email đã tồn tại — phải hiển thị thông báo lỗi rõ ràng.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

## PHẦN 2: KHÁCH HÀNG (Customer — Đã đăng nhập)

> Đăng nhập bằng: `customer@test.vn` / `pasword123`

### [TC-C-01] Đăng nhập hệ thống
- [ ] Vào trang `/login`, nhập email và mật khẩu đúng — đăng nhập thành công.
- [ ] Navbar cập nhật: Hiển thị tên "Khách hàng", biểu tượng giỏ hàng, chuông thông báo, menu Avatar.
- [ ] Nút **Đăng nhập / Đăng ký** biến mất.
- [ ] Thử đăng nhập sai mật khẩu — hiển thị thông báo lỗi rõ ràng.
- [ ] Thử đăng nhập email không tồn tại — hiển thị thông báo lỗi.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-02] Quản lý Danh sách Yêu thích (Wishlist)
- [ ] Mở trang chi tiết sách bất kỳ.
- [ ] Nhấn biểu tượng **Trái tim** — icon chuyển sang màu xanh đậm (đã thích).
- [ ] Nhấn lại biểu tượng trái tim — quay về trạng thái chưa thích (toggle).
- [ ] Vào menu **Yêu thích** — sách vừa thích xuất hiện trong danh sách.
- [ ] Xóa sách khỏi danh sách yêu thích từ trang Yêu thích — danh sách tự cập nhật.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-03] Giỏ hàng (Cart)
- [ ] Từ trang chi tiết sách, nhấn **Thêm vào giỏ hàng**.
- [ ] Toast thông báo nhỏ xuất hiện "Đã thêm vào giỏ".
- [ ] Badge số lượng trên biểu tượng giỏ hàng Navbar tăng thêm 1.
- [ ] Vào trang `/cart` — sách vừa thêm hiển thị đầy đủ thông tin và giá.
- [ ] Nhấn nút `+` để tăng số lượng — Tổng tiền tự cập nhật chính xác.
- [ ] Nhấn nút `-` để giảm số lượng — khi về 0 hỏi xác nhận xóa hoặc tự xóa.
- [ ] Nhấn nút **Xóa** để xóa một sản phẩm khỏi giỏ — danh sách cập nhật.
- [ ] Khi giỏ hàng trống — hiển thị thông báo "Giỏ hàng trống" và link quay lại mua sắm.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-04] Áp dụng Mã giảm giá
- [ ] Tại trang Giỏ hàng, nhập mã giảm giá hợp lệ (ví dụ: mã Admin đã tạo trước đó).
- [ ] Nhấn **Áp dụng** — tiền giảm giá được trừ khỏi tổng tiền, hiển thị rõ ràng.
- [ ] Nhập mã không tồn tại hoặc đã hết hạn — hiển thị thông báo lỗi.
- [ ] Nhấn **Xóa mã** — giá quay về giá gốc.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-05] Thanh toán COD (Tiền mặt khi nhận hàng)
- [ ] Tại Giỏ hàng, nhấn **Tiến hành thanh toán** — chuyển sang trang `/checkout`.
- [ ] Điền đầy đủ: Họ tên người nhận, Số điện thoại, Địa chỉ giao hàng.
- [ ] Chọn phương thức **Thanh toán khi nhận hàng (COD)**.
- [ ] Nhấn **Đặt hàng ngay** — chuyển sang trang thành công `/payment-result`.
- [ ] Giỏ hàng được xóa trống sau khi đặt thành công.
- [ ] Kiểm tra trường hợp để trống thông tin — hiển thị lỗi validation cho từng trường.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-06] Thanh toán PayOS (VietQR)
- [ ] Thêm sách vào giỏ hàng, vào trang Checkout.
- [ ] Chọn phương thức **PayOS (VietQR)** và nhấn **Đặt hàng ngay**.
- [ ] Hệ thống tạo đơn hàng và chuyển hướng sang trang thanh toán PayOS (VietQR).
- [ ] Trang PayOS hiển thị mã QR để quét thanh toán.
- [ ] Sau khi thanh toán thành công — hệ thống tự chuyển hướng về trang kết quả thành công.
- [ ] Đơn hàng cập nhật trạng thái từ `PENDING` sang `PAID`.

> *Lưu ý: Kiểm thử kịch bản này cần thực hiện thanh toán thật bằng ứng dụng ngân hàng. Số tiền sẽ nhỏ để dễ kiểm thử (ví dụ: thêm sách giá thấp nhất).*

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-07] Lịch sử đơn hàng
- [ ] Vào menu Avatar -> **Lịch sử đơn hàng** (hoặc trang `/orders`).
- [ ] Đơn hàng vừa đặt ở TC-C-05 và TC-C-06 đều xuất hiện với trạng thái đúng.
- [ ] Click **Xem chi tiết** — hiển thị đầy đủ thông tin đơn hàng: sách, số lượng, địa chỉ, tổng tiền.
- [ ] Đơn `PENDING` (COD) có nút **Hủy đơn** — thử nhấn và xác nhận hủy thành công.
- [ ] Đơn `PENDING` (PayOS chưa thanh toán) có nút **Thanh toán ngay** — nhấn dẫn sang PayOS.
- [ ] Đơn COD không hiển thị nút **Thanh toán ngay**.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-08] Trung tâm Thông báo
- [ ] Nhấn vào biểu tượng chuông trên Navbar.
- [ ] Danh sách thông báo hiện ra (thông báo trạng thái đơn hàng nếu có).
- [ ] Nhấn **Đánh dấu tất cả là đã đọc** — huy hiệu số lượng thông báo về 0.
- [ ] Nhấn vào một thông báo cụ thể — đánh dấu là đã đọc.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-09] Tủ sách & AI Chat (RAG)

> *Lưu ý: Để kịch bản này chạy được, cần Admin duyệt đơn hàng lên trạng thái `DELIVERED` trước. Xem hướng dẫn bên dưới ở Phần 3 TC-A-04.*

- [ ] Đăng nhập bằng `admin@test.vn`, duyệt đơn hàng của `customer@test.vn` lên `DELIVERED`.
- [ ] Đăng xuất khỏi Admin, đăng nhập lại bằng `customer@test.vn`.
- [ ] Vào **Tủ sách** (menu Navbar) — sách đã mua xuất hiện trên kệ.
- [ ] Nhấn **Đọc sách / Hỏi đáp AI** trên cuốn sách đó.
- [ ] Gửi câu hỏi: *"Cuốn sách này nói về chủ đề gì?"*
- [ ] AI trả lời dựa trên nội dung sách (nếu đã được vector hóa RAG).
- [ ] Nếu sách chưa được vector hóa, hệ thống hiển thị thông báo phù hợp.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-C-10] Đăng xuất
- [ ] Nhấn menu Avatar -> **Đăng xuất**.
- [ ] Navbar quay về trạng thái khách vãng lai (hiển thị nút Đăng nhập / Đăng ký).
- [ ] Token được xóa khỏi localStorage — thử reload trang, vẫn ở trạng thái đăng xuất.
- [ ] Thử truy cập `/cart` sau khi đăng xuất — chuyển hướng về `/login`.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

## PHẦN 3: QUẢN TRỊ VIÊN (Admin — Toàn quyền)

> Đăng nhập bằng: `admin@test.vn` / `pasword123`

### [TC-A-01] Đăng nhập & Truy cập bảng quản trị
- [ ] Đăng nhập bằng tài khoản Admin.
- [ ] Nút **Quản trị** xuất hiện trên Navbar — nhấn vào để vào trang `/admin`.
- [ ] Bảng điều khiển hiển thị đầy đủ các tab: *Tổng quan, Người dùng, Quản lý sách, Thể loại, Kho hàng, Đơn hàng, Mã giảm giá, Bài viết, Vector hóa RAG, AI Chat CRM*.
- [ ] Tab **Tổng quan** hiển thị các thống kê: Tổng doanh thu, Tổng đơn hàng, Tổng người dùng, Tổng sách.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-02] Quản lý Người dùng (Chỉ Admin)
- [ ] Chọn tab **Người dùng** — danh sách tất cả tài khoản hiển thị.
- [ ] Tìm kiếm người dùng theo email.
- [ ] Nhấn nút **Vô hiệu hóa** một tài khoản bất kỳ — trạng thái tài khoản thay đổi.
- [ ] Nhấn **Kích hoạt lại** tài khoản đó — trạng thái khôi phục.
- [ ] Xác nhận vai trò Curator KHÔNG nhìn thấy tab Người dùng này.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-03] Quản lý Sách & Bộ sưu tập ảnh chi tiết (Thêm / Sửa / Ẩn / Xóa)
- [ ] Chọn tab **Quản lý sách** — danh sách toàn bộ sách (kể cả sách ẩn).
- [ ] Nhấn **+ Thêm Sách Mới** — điền đầy đủ thông tin và upload ảnh bìa (JPG/PNG < 5MB).
- [ ] Tại phần **Bộ sưu tập ảnh chi tiết (Nhóm 4)**:
  - Tải lên 2 ảnh chi tiết phụ từ máy tính và điền số thứ tự hiển thị (ví dụ: `2`, `1`).
  - Dán một URL ảnh phụ trực tiếp và nhấn thêm thành công.
- [ ] Nhấn **Thêm sách** — sách mới xuất hiện trong danh sách.
- [ ] Mở trang chi tiết sách Storefront để xác nhận: Ảnh bìa chính hiển thị đầu tiên, các ảnh phụ hiển thị theo đúng thứ tự `1`, `2`.
- [ ] Nhấn **Sửa** cuốn sách đó: thay đổi số thứ tự hiển thị, xóa bớt 1 ảnh phụ, tải thêm ảnh phụ mới và nhấn lưu — xác nhận thay đổi hiệu lực.
- [ ] Chuyển trạng thái sách sang **Tạm ẩn** — sách biến mất khỏi trang chủ (kiểm tra ở tab ẩn danh).
- [ ] Chuyển lại **Công khai** — sách xuất hiện trở lại.
- [ ] Nhấn **Xóa** cuốn sách đó — xác nhận popup — cuốn sách cùng toàn bộ ảnh phụ chi tiết trong bảng `book_images` bị xóa sạch (cascade deletion).
- [ ] Thử nhập dữ liệu không hợp lệ (để trống tên, giá âm, tệp ảnh > 5MB) — hệ thống ngăn chặn và báo lỗi rõ ràng.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-04] Xử lý Đơn hàng (Order Management)
- [ ] Chọn tab **Đơn hàng** — danh sách toàn bộ đơn hàng.
- [ ] Lọc theo trạng thái `PENDING` — tìm đơn hàng của `customer@test.vn`.
- [ ] Nhấn xem **Chi tiết đơn hàng** — thông tin đầy đủ.
- [ ] Duyệt đơn: Chuyển từ `PENDING` → `CONFIRMED` → `PACKAGING` → `DELIVERING` → `DELIVERED`.
- [ ] Sau khi duyệt đến `DELIVERED`, vào tab **Kho hàng** — số lượng sách sẵn có giảm, số lượng đã bán tăng.
- [ ] Thử kịch bản **Hủy đơn** từ trạng thái `PENDING` — kiểm tra số lượng kho được hoàn trả.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-05] Quản lý Thể loại (Category Management)
- [ ] Chọn tab **Thể loại**.
- [ ] Nhấn **+ Thêm thể loại mới** — nhập tên và mô tả, lưu thành công.
- [ ] Thể loại mới xuất hiện trong bộ lọc trang chủ và trong form thêm sách.
- [ ] Nhấn **Sửa** — thay đổi tên thể loại — xác nhận thay đổi hiệu lực.
- [ ] Nhấn **Xóa** thể loại không có sách nào — xóa thành công.
- [ ] Nhấn **Xóa** thể loại đang được gán cho sách — hệ thống từ chối hoặc cảnh báo.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-06] Quản lý Kho hàng (Inventory Management)
- [ ] Chọn tab **Kho hàng**.
- [ ] Bảng hiển thị: Tên sách, Số lượng sẵn có (Màu xanh ≥ 10 / Vàng 1-9 / Đỏ = 0), Số đang giữ, Số đã bán.
- [ ] Nhập số lượng mới vào ô tồn kho, điền lý do điều chỉnh và nhấn **Lưu**.
- [ ] Thử nhập số lượng âm — hệ thống ngăn chặn và báo lỗi.
- [ ] Kéo xuống xem **Nhật ký biến động kho** — dòng vừa điều chỉnh xuất hiện với đầy đủ thông tin.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-07] Quản lý Mã giảm giá (Coupon Management)
- [ ] Chọn tab **Mã giảm giá** — danh sách mã hiện có.
- [ ] Nhấn **+ Tạo mã mới**:
  - Mã theo phần trăm: `TEST10`, loại *Phần trăm*, giá trị `10`, đơn tối thiểu `100000`.
  - Mã theo số tiền: `FIXED20K`, loại *Số tiền cố định*, giá trị `20000`.
- [ ] Xác nhận mã tạo thành công và xuất hiện trong danh sách.
- [ ] Dùng công tắc **Bật/Tắt** để vô hiệu hóa mã — xác nhận trạng thái thay đổi.
- [ ] Quay sang tài khoản `customer@test.vn`, dùng mã `TEST10` tại Giỏ hàng — xác nhận mã hoạt động đúng.
- [ ] Nhấn **Xóa** mã giảm giá (quyền Admin) — mã bị xóa khỏi hệ thống.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-08] Quản lý Bài viết Blog (Article/CMS Management)
- [ ] Chọn tab **Bài viết**.
- [ ] Nhấn **+ Thêm Bài viết mới** — nhập tiêu đề, tóm tắt, nội dung (nhiều đoạn văn), chuyên mục, thời gian đọc.
- [ ] Lưu bài viết ở trạng thái **DRAFT** — xác nhận bài KHÔNG xuất hiện trên trang chủ.
- [ ] Chuyển bài sang **PUBLISHED** — bài viết xuất hiện ở phần **BÀI VIẾT NỔI BẬT** trang chủ.
- [ ] Nhấn **Sửa** — thay đổi tiêu đề và lưu — xác nhận thay đổi hiệu lực.
- [ ] Chuyển bài sang **HIDDEN** — bài biến mất khỏi trang chủ.
- [ ] Nhấn **Xóa** bài viết — xác nhận và bài bị xóa.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-09] Vector hóa Tài liệu RAG (AI Indexing)
- [ ] Chọn tab **Vector hóa RAG** — danh sách sách và trạng thái vector hóa.
- [ ] Nhấn **Upload PDF** trên một cuốn sách chưa được vector hóa.
- [ ] Thử tải file không phải PDF (`.docx`, `.txt`) — hệ thống từ chối và báo lỗi định dạng.
- [ ] Tải file PDF hợp lệ — hệ thống xử lý, thanh tiến trình hiển thị.
- [ ] Sau khi hoàn tất — cột "RAG Indexed At" cập nhật thời gian vector hóa thành công.

> *Lưu ý: Chức năng này yêu cầu dịch vụ AI backend (sdl-ai-service) đang chạy. Nếu AI service chưa deploy thì bỏ qua.*

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-A-10] AI Chat CRM (Theo dõi hội thoại)
- [ ] Chọn tab **AI Chat CRM**.
- [ ] Danh sách các phiên trò chuyện AI của khách hàng với sách hiển thị.
- [ ] Click xem chi tiết một phiên — lịch sử hội thoại giữa khách hàng và AI hiển thị đầy đủ.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

## PHẦN 4: THỦ THƯ (Curator — Quyền hạn giới hạn)

> Đăng nhập bằng: `curator@test.vn` / `pasword123`

### [TC-CUR-01] Xác minh phân quyền giới hạn & Chặn Tổng quan
- [ ] Đăng nhập bằng tài khoản Curator.
- [ ] Tab **Tổng quan (Overview)** và tab **Người dùng** hoàn toàn biến mất khỏi menu quản trị.
- [ ] Nếu cố tình truy cập trực tiếp bằng URL (`/admin?tab=overview` hoặc `/admin?tab=users`), hệ thống tự động redirect về tab hợp lệ đầu tiên (ví dụ: `books`).
- [ ] Nút **Xóa sách** KHÔNG hiển thị (chỉ Admin mới xóa được sách).
- [ ] Nút **Xóa thể loại** KHÔNG hiển thị.
- [ ] Nút **Xóa mã giảm giá** KHÔNG hiển thị.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-CUR-02] Thêm & Sửa Sách (Curator có quyền toàn diện)
- [ ] Nhấn **+ Thêm Sách Mới**, nhập thông tin hợp lệ, thêm ảnh phụ chi tiết và lưu thành công.
- [ ] Nhấn **Sửa** thông tin một cuốn sách — thay đổi mô tả, ảnh bìa, danh mục và cập nhật ảnh chi tiết phụ thành công.
- [ ] Thay đổi trạng thái sách từ **Công khai** sang **Tạm ẩn** thành công.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-CUR-03] Quản lý Kho hàng (Chế độ Chỉ Xem - Read Only)
- [ ] Click vào tab **Kho hàng**.
- [ ] Nút "⚙️ Nhập / Điều chỉnh" của từng cuốn sách KHÔNG hiển thị, thay thế bằng nhãn `"Chỉ xem"` màu xám.
- [ ] Xác nhận Curator chỉ có thể xem số lượng tồn kho hiện tại và **Nhật ký biến động kho** mà không thể sửa đổi số lượng.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-CUR-04] Xử lý Đơn hàng (Chế độ Chỉ Xem - Read Only)
- [ ] Click vào tab **Đơn hàng**.
- [ ] Cột chọn checkbox hàng loạt và thanh công cụ tác vụ hàng loạt (Bulk Action Bar) hoàn toàn biến mất.
- [ ] Nút cập nhật tiến trình đơn hàng ("→ Đóng gói", "→ Đang giao"...) và nút "Hủy đơn" KHÔNG xuất hiện ở danh sách.
- [ ] Nhấp xem **Chi tiết đơn hàng** — thông tin hiển thị đầy đủ, nút in hóa đơn có sẵn nhưng nút cập nhật trạng thái đơn hàng và hủy đơn hàng bị ẩn hoàn toàn.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

## PHẦN 5: KIỂM TRA KỸ THUẬT & BẢO MẬT

### [TC-SEC-01] Bảo mật API — Không có Token
- [ ] Gửi request API không có token đến `GET https://sdl-backend.onrender.com/api/cart` — nhận `401 Unauthorized`.
- [ ] Gửi request API không có token đến `DELETE https://sdl-backend.onrender.com/api/books/1` — nhận `401 Unauthorized`.
- [ ] Gửi request API không có token đến `POST https://sdl-backend.onrender.com/api/admin/users` — nhận `401 Unauthorized`.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-SEC-02] Bảo mật API — Sai phân quyền (Privilege Escalation)
- [ ] Đăng nhập bằng `customer@test.vn`, lấy JWT Token từ `localStorage`.
- [ ] Dùng token Customer gửi request `POST https://sdl-backend.onrender.com/api/books` (tạo sách) — nhận `403 Forbidden`.
- [ ] Dùng token Customer gửi request `GET https://sdl-backend.onrender.com/api/admin/users` — nhận `403 Forbidden`.
- [ ] Dùng token Curator gửi request `DELETE https://sdl-backend.onrender.com/api/books/1` (xóa sách) — nhận `403 Forbidden`.
- [ ] Dùng token Curator gửi request `GET https://sdl-backend.onrender.com/api/admin/stats` (thống kê tổng quan) — nhận `403 Forbidden`.
- [ ] Dùng token Curator gửi request `PUT https://sdl-backend.onrender.com/api/admin/orders/[id]/status` (cập nhật đơn hàng) — nhận `403 Forbidden`.
- [ ] Dùng token Curator gửi request `PUT https://sdl-backend.onrender.com/api/inventory/[id]` (sửa số lượng tồn kho) — nhận `403 Forbidden`.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

### [TC-PERF-01] Hiệu suất & Responsive
- [ ] Mở DevTools (F12) → Network tab → Reload trang chủ — kiểm tra không có request nào trả về lỗi đỏ.
- [ ] Trang chủ tải hoàn chỉnh trong vòng dưới 5 giây (kể cả thời gian Render wakeup lần đầu có thể đến 50 giây).
- [ ] Kiểm tra giao diện trên màn hình điện thoại (responsive): Navbar thu gọn, danh sách sách hiển thị 1-2 cột, form đặt hàng hiển thị đúng.
- [ ] Kiểm tra trên Chrome, Firefox, Edge — giao diện không bị vỡ layout.

**Kết quả**: `Pass / Fail` — Ghi chú: _______________

---

## PHẦN 6: KIỂM TRA LUỒNG E2E TỔNG HỢP

### [TC-E2E-01] Luồng mua hàng hoàn chỉnh (End-to-End)
Thực hiện toàn bộ luồng liên tiếp không gián đoạn:
1. [ ] Mở trình duyệt ẩn danh → Truy cập trang chủ Production.
2. [ ] Tìm kiếm sách bằng từ khóa.
3. [ ] Xem chi tiết một cuốn sách.
4. [ ] Đăng ký tài khoản mới → Đăng nhập.
5. [ ] Thêm sách vào Giỏ hàng (thêm ít nhất 2 cuốn khác nhau).
6. [ ] Áp dụng mã giảm giá (nếu có).
7. [ ] Tiến hành Checkout, điền thông tin giao hàng, chọn COD.
8. [ ] Xác nhận đơn hàng thành công, giỏ hàng trống.
9. [ ] Xem Lịch sử đơn hàng → Kiểm tra đơn vừa đặt.
10. [ ] Đăng nhập bằng Admin → Duyệt đơn lên `DELIVERED`.
11. [ ] Quay lại tài khoản Customer → Vào Tủ sách → Sách được mở khóa.
12. [ ] Thử hỏi AI (nếu sách đã được vector hóa).

**Toàn bộ luồng hoạt động**: `Pass / Fail` — Ghi chú: _______________

---

## Tổng kết Kết quả Kiểm thử

| Phần | Tổng số TC | Pass | Fail | Ghi chú |
|------|-----------|------|------|---------|
| Phần 1: Guest | 6 | | | |
| Phần 2: Customer | 10 | | | |
| Phần 3: Admin | 10 | | | |
| Phần 4: Curator | 4 | | | |
| Phần 5: Bảo mật & Hiệu suất | 3 | | | |
| Phần 6: E2E | 1 | | | |
| **Tổng cộng** | **34** | | | |

---

## Các lỗi phát hiện (Bug Report)

| STT | Mã TC | Mô tả lỗi | Mức độ | Trạng thái |
|-----|-------|-----------|--------|-----------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

> **Mức độ lỗi**: 🔴 Nghiêm trọng (Chặn chức năng chính) / 🟡 Trung bình (Ảnh hưởng UX) / 🟢 Nhỏ (Vấn đề giao diện)
