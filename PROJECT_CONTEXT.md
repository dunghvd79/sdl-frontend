# 🎨 Smart Digital Library (SDL) — Frontend Context

> **Dự án:** Smart Digital Library (SDL) - Phân hệ Frontend  
> **Cập nhật lần cuối:** 06/2026  
> **URL Production:** [https://pigeon-bookstore.netlify.app](https://pigeon-bookstore.netlify.app)  
> **Backend API URL:** [https://sdl-backend.onrender.com](https://sdl-backend.onrender.com)  
> **AI Service URL:** [https://sdl-ai-service.onrender.com](https://sdl-ai-service.onrender.com)

---

## 🎯 Tổng quan repo Frontend
Thư mục này chứa toàn bộ mã nguồn của giao diện người dùng (Client-side) cho ứng dụng **Smart Digital Library (SDL)**. Đây là một ứng dụng Single Page Application (SPA) được thiết kế hiện đại, responsive cao, kết hợp trải nghiệm mua sắm sách truyền thống và phòng đọc sách số thông minh tích hợp trợ lý AI RAG.

---

## 🏗️ Kiến trúc & Công nghệ (Tech Stack)

### Công nghệ cốt lõi
*   **React 19.2**: Sử dụng phiên bản React mới nhất tận dụng tối đa cải tiến hiệu năng.
*   **Vite 5.4**: Công cụ đóng gói ứng dụng siêu nhanh giúp tối ưu thời gian phát triển và build.
*   **React Router DOM v7.1**: Hỗ trợ quản lý routing phức tạp, nested routes và phân quyền trang (Protected Routes).
*   **React Query v5 (@tanstack/react-query)**: Quản lý state server, caching, đồng bộ dữ liệu và tự động làm mới (auto-refetch).
*   **Tailwind CSS v4** + `@tailwindcss/postcss`: Style giao diện hiện đại, tối ưu dung lượng CSS.
*   **Lucide React**: Bộ icon vector phong phú và sắc nét.
*   **React Hot Toast**: Hiển thị thông báo trạng thái thao tác mượt mà.
*   **Axios**: Trình khách gọi API đến backend.

---

## 📁 Cấu trúc mã nguồn (`src/`)

```
src/
├── assets/             # Hình ảnh tĩnh, logo
├── components/         # Các component dùng chung (Navbar, Footer, BookCard, ProtectedRoute, ConfirmDialog...)
├── context/            # Quản lý State toàn cục (AuthContext, CartContext)
├── pages/              # Danh sách 18 trang chính của ứng dụng
├── services/           # Tập hợp các hàm gọi REST API (auth, book, order, ai, v.v.)
├── utils/              # Các hàm bổ trợ (format tiền tệ, định dạng ngày tháng)
├── App.css             # Style tùy biến cho App
├── index.css           # Cấu hình Tailwind CSS v4 toàn cục
├── App.jsx             # File định tuyến chính (Router Configuration)
└── main.jsx            # Điểm khởi đầu render ứng dụng React
```

---

## 📄 Danh sách Pages & Routes chi tiết

Ứng dụng gồm **18 trang chức năng** phục vụ cho tất cả các nhóm người dùng:

| Tên Trang | Route định tuyến | Phân quyền truy cập | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| **HomePage** | `/` | Tất cả (Guest/User) | Trang chủ: Tìm kiếm sách, lọc theo danh mục, hiển thị sách nổi bật, sách mới, Editor's Picks. |
| **BookDetailPage** | `/books/:id` | Tất cả (Guest/User) | Chi tiết sách: Thông tin tác giả, giá, mô tả, đánh giá từ khách hàng, thêm vào giỏ hàng/yêu thích. |
| **ChatPage** | `/books/:id/chat` | Đã đăng nhập (Customer) | Phòng chat đọc sách ảo: Cho phép hỏi đáp AI (RAG) trực tiếp dựa trên nội dung cuốn sách hiện tại. |
| **CartPage** | `/cart` | Tất cả (Guest/User) | Giỏ hàng cá nhân: Cập nhật số lượng, áp mã giảm giá (Coupon), xem tổng tiền. |
| **CheckoutPage** | `/checkout` | Đã đăng nhập (Customer) | Thanh toán: Nhập thông tin giao hàng, chọn phương thức (COD hoặc PayOS VietQR). |
| **PaymentResultPage**| `/payment-result` | Đã đăng nhập (Customer) | Trang hiển thị trạng thái thanh toán trả về từ cổng PayOS. |
| **OrderHistoryPage** | `/orders` | Đã đăng nhập (Customer) | Lịch sử mua hàng: Danh sách các đơn hàng đã đặt kèm trạng thái. |
| **OrderDetailPage**  | `/orders/:id` | Đã đăng nhập (Customer) | Xem chi tiết đơn hàng: Mã đơn, sản phẩm, lịch sử vận chuyển, thanh toán. |
| **MyShelfPage** | `/shelf` | Đã đăng nhập (Customer) | Tủ sách kỹ thuật số: Nơi chứa sách đã mua, hỗ trợ đọc trực tuyến và mở tính năng Chat AI RAG. |
| **WishlistPage** | `/wishlist` | Đã đăng nhập (Customer) | Danh sách yêu thích của khách hàng. |
| **NotificationsPage**| `/notifications` | Đã đăng nhập (Customer) | Xem các thông báo từ hệ thống về đơn hàng hoặc tin khuyến mãi. |
| **ProfilePage** | `/profile` | Đã đăng nhập (Customer) | Cập nhật thông tin cá nhân, mật khẩu, ảnh đại diện. |
| **AdminDashboardPage**| `/admin` | Admin / Curator | Trang quản trị tập trung: Quản lý Sách, Đơn hàng, Người dùng, Kho hàng, Blog, Coupon, Tải tài liệu RAG lên AI. |
| **BlogPage** | `/blog` | Tất cả (Guest/User) | Danh sách bài viết chia sẻ, tin tức thư viện số. |
| **ArticleDetailPage**| `/blog/:id` | Tất cả (Guest/User) | Xem chi tiết một bài viết trên Blog. |
| **LoginPage** | `/login` | Chưa đăng nhập (Guest) | Form đăng nhập hệ thống. |
| **RegisterPage** | `/register` | Chưa đăng nhập (Guest) | Form đăng ký tài khoản khách hàng mới. |
| **PromotionsPage** | `/promotions` | Tất cả (Guest/User) | Trang hiển thị danh sách các mã giảm giá và chương trình ưu đãi hiện hành. |

---

## 🔒 Quản lý Trạng thái & Phân quyền

### 1. State Management (React Context)
*   **AuthContext**: Lưu giữ thông tin người dùng hiện tại sau khi đăng nhập và Token JWT. Token này được lưu ở `localStorage` để tự động khôi phục phiên khi tải lại trang.
*   **CartContext**: Quản lý giỏ hàng tạm thời và đồng bộ với giỏ hàng của tài khoản khi người dùng đăng nhập thành công.

### 2. Định tuyến Bảo mật (ProtectedRoute)
Component `ProtectedRoute.jsx` đóng vai trò chặn các truy cập trái phép. Nếu người dùng chưa đăng nhập, hệ thống tự động chuyển hướng về `/login`. Nếu truy cập trang Admin/Curator mà không đủ quyền, trang sẽ hiển thị thông báo lỗi hoặc chuyển hướng về trang chủ.

---

## ⚙️ Cấu hình môi trường Local

Để chạy dự án ở máy cá nhân, tạo file `.env` tại thư mục gốc của frontend (`code_frontend/sdl-frontend/`):

```ini
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Hướng dẫn khởi chạy Local

1.  Di chuyển vào thư mục frontend:
    ```bash
    cd code_frontend/sdl-frontend
    ```
2.  Cài đặt các thư viện cần thiết:
    ```bash
    npm install
    ```
3.  Khởi động môi trường phát triển:
    ```bash
    npm run dev
    ```
    *Mặc định giao diện sẽ chạy tại:* [http://localhost:5173](http://localhost:5173)
4.  Build ứng dụng đóng gói:
    ```bash
    npm run build
    ```
