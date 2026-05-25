# Kế hoạch triển khai: Quản trị & Vector hóa Sách (Admin/Curator Dashboard)

Tài liệu này chi tiết hóa phương án xây dựng phân hệ quản trị dành cho người dùng có vai trò `ADMIN` và `CURATOR` (Thủ thư). Phân hệ này sẽ cung cấp giao diện quản lý sách, cập nhật số lượng tồn kho trực tiếp và tải lên sách PDF để tự động vector hóa (RAG) sang FastAPI AI Service.

---

## 📊 1. Kiến trúc phân hệ Quản trị (Admin Architecture)

```mermaid
graph TD
    subgraph Frontend [Vite React Client]
        AdminUI[AdminDashboardPage.jsx]
        NavbarAdmin[Navbar.jsx - Admin Tab]
    end

    subgraph Backend [Node.js Express Server]
        Multer[Multer Middleware]
        BookCtrl[BookController.js]
        InvCtrl[InventoryController.js]
        AiCtrl[AiController.js]
    end

    subgraph AIService [FastAPI Python Service]
        FastAPIUpload[/api/documents/upload]
        Parser[PDF Plumber Parser]
        ChromaDB[(Vector DB - Chroma)]
    end

    AdminUI -->|1. Thêm/Sửa/Xóa Sách| BookCtrl
    AdminUI -->|2. Cập nhật Kho| InvCtrl
    AdminUI -->|3. Upload PDF File| Multer
    Multer -->|4. Forward Stream| AiCtrl
    AiCtrl -->|5. Post File + bookId| FastAPIUpload
    FastAPIUpload -->|6. Trích xuất text| Parser
    Parser -->|7. Embed & Index| ChromaDB
```

---

## 📋 2. Chi tiết các bước thực hiện & File sửa đổi

### Bước 2.1: Cài đặt thư viện upload file ở Node.js Backend
Chúng ta cần cài đặt thư viện `multer` cho Express để tiếp nhận luồng dữ liệu file nhị phân (PDF) từ Frontend gửi lên:
```bash
npm install multer --save
```

---

### Bước 2.2: Bổ sung API phía Node.js Backend

#### 1. API Quản lý Kho (Inventory)
* **[NEW]** `src/controllers/inventoryController.js`:
  * `static async getAll(req, res)`: Lấy toàn bộ sách cùng thông tin kho hàng tương ứng (`available_qty`, `reserved_qty`, `sold_qty`).
  * `static async updateAvailableQty(req, res)`: Nhận `bookId` và `availableQty` để cập nhật trực tiếp vào cơ sở dữ liệu.
* **[NEW]** `src/routes/inventory.js`:
  * Khai báo các route và bảo vệ bằng `verifyToken` và `requireRole(['ADMIN', 'CURATOR'])`.
* **[MODIFY]** `src/config/app.js`: Đăng ký route mới `/api/inventory`.

#### 2. API Forward File PDF sang FastAPI AI Service
* **[MODIFY]** `src/routes/ai.js`:
  * Định nghĩa thêm route `POST /api/ai/upload/:bookId`.
  * Áp dụng middleware `multer` (chỉ nhận file `.pdf`).
* **[MODIFY]** `src/controllers/aiController.js` & **[MODIFY]** `src/services/aiService.js`:
  * Hàm `uploadBookPDF(bookId, file)`: Nhận file từ Controller.
  * Sử dụng thư viện `axios` cùng đối tượng `FormData` để tạo luồng HTTP POST đa phần (multipart/form-data) gửi file trực tiếp sang đầu cuối của FastAPI (`POST http://127.0.0.1:8000/api/documents/upload`).

---

### Bước 2.3: Xây dựng Giao diện phía Frontend (Vite React)

#### 1. Thêm Route Bảo vệ (Protected Route Helper)
* **[NEW]** [ProtectedRoute.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/components/ProtectedRoute.jsx): 
  * Bọc các trang admin. Nếu người dùng chưa đăng nhập hoặc role không phải `ADMIN` / `CURATOR`, sẽ tự động chuyển hướng về trang chủ hoặc trang báo lỗi.

#### 2. Tạo Trang Dashboard Admin
* **[NEW]** [AdminDashboardPage.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/pages/AdminDashboardPage.jsx):
  * Thiết kế giao diện Dashboard sang trọng với 3 Tab chính:
    1. **Tab 1: Quản lý Sách (Book Manager):** Hiển thị danh sách bảng. Có nút "Thêm sách mới" mở Modal nhập thông tin. Có nút Sửa (sửa title, author, price, description) và Xóa sách.
    2. **Tab 2: Quản lý Kho (Inventory Manager):** Hiển thị danh sách tồn kho. Cho phép chỉnh sửa trực tiếp số lượng có sẵn (`Available Qty`) của mỗi cuốn sách bằng input số lượng và nút Lưu nhanh.
    3. **Tab 3: Vector hóa RAG (AI Document RAG Indexer):** Liệt kê các sách hiện có. Mỗi cuốn sách có một ô chọn file PDF và nút "Tải lên & Vector hóa". Khi click, hiển thị hiệu ứng Loading và thanh tiến trình cho đến khi AI Service phản hồi thành công.

#### 3. Điều hướng & Tích hợp vào Ứng dụng
* **[MODIFY]** [Navbar.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/components/Navbar.jsx): Hiển thị tab **"⚙️ Quản trị"** khi `user.role === 'ADMIN' || user.role === 'CURATOR'`.
* **[MODIFY]** [App.jsx](file:///e:/it-project/smart_digital_library/code_frontend/sdl-frontend/src/App.jsx): 
  * Import `AdminDashboardPage` và `ProtectedRoute`.
  * Đăng ký route `/admin` được bọc bởi `<ProtectedRoute roles={['ADMIN', 'CURATOR']}>`.

---

## 🔬 3. Kế hoạch Xác minh & Kiểm thử (Verification Plan)

### 1. Phân quyền truy cập
* Đăng nhập tài khoản thông thường (USER) -> Gõ thẳng địa chỉ `/admin` trên URL trình duyệt -> Xác nhận hệ thống chặn và chuyển hướng về trang chủ.
* Đăng nhập tài khoản ADMIN -> Xác nhận xuất hiện nút "Quản trị" trên Navbar và truy cập bình thường vào `/admin`.

### 2. Quản lý sách & Kho
* Tạo 1 cuốn sách mới tên: *“Clean Code”* giá *150,000 đ* -> Kiểm tra bảng sách hiển thị đúng.
* Qua tab quản lý kho, kiểm tra sách mới đã tự động khởi tạo tồn kho mặc định. Cập nhật số lượng có sẵn thành *50 cuốn* -> Bấm lưu -> Kiểm tra lại xem trang chi tiết sách ngoài trang chủ đã nhận số lượng tồn kho mới chưa.

### 3. Tải lên và vector hóa (RAG Test)
* Chuẩn bị file PDF mẫu ngắn -> Chọn file ở Tab 3 của cuốn sách tương ứng -> Bấm **Vector hóa**.
* Quan sát log của FastAPI console xem có in ra tiến trình đọc PDF và lưu embeddings vào ChromaDB hay không.
* Sau khi báo thành công, mở tính năng Chat AI của cuốn sách đó và hỏi câu hỏi liên quan đến nội dung file vừa tải lên để kiểm tra phản hồi.
