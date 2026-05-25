📚 Project Overview: Smart Digital Library (SDL)
Smart Digital Library (SDL) là một hệ sinh thái thư viện số thông minh, đại diện cho bước tiến mới trong việc kết hợp giữa Thương mại điện tử (E-commerce) và Hệ thống hỗ trợ tri thức (Knowledge Retrieval System). Thay vì chỉ là một kho lưu trữ sách trực tuyến thông thường, SDL hướng tới việc biến mỗi cuốn sách thành một "trợ lý tri thức" tương tác, cho phép người dùng khai thác dữ liệu sâu thông qua trí tuệ nhân tạo.

🚀 Core Pillars (Trụ cột cốt lõi)
Hệ thống được xây dựng dựa trên hai trục nghiệp vụ chính:

Thông minh hóa giao dịch (Smart E-commerce): Cung cấp trải nghiệm mua sắm mượt mà với quy trình xử lý đơn hàng chặt chẽ. Hệ thống tích hợp cơ chế Concurrency Control (Hold/Release kho) để đảm bảo tính toàn vẹn dữ liệu, ngăn chặn tình trạng bán vượt số lượng thực tế trong môi trường nhiều người dùng cùng lúc.

Tương tác tri thức (AI-Driven RAG): Sử dụng kiến trúc Retrieval-Augmented Generation (RAG) để "đọc hiểu" nội dung sách. Người dùng có thể trực tiếp đặt câu hỏi và nhận câu trả lời chính xác dựa trên ngữ cảnh thực tế của tài liệu PDF/EPUB mà họ sở hữu.

🛠 Technical Ecosystem (Hệ sinh thái kỹ thuật)
Dự án áp dụng kiến trúc phân tách lớp (Layered Architecture) để tối ưu hóa hiệu suất và khả năng mở rộng:

Backend chính (Node.js/Express): Đóng vai trò là API Gateway, quản lý người dùng, giỏ hàng, và luồng giao dịch thanh toán.

AI Engine (Python/FastAPI): Chuyên trách xử lý ngôn ngữ tự nhiên, thực hiện quy trình Embedding Pipeline và truy vấn ngữ nghĩa (Semantic Search).

Dữ liệu đa tầng:

PostgreSQL: Lưu trữ dữ liệu cấu trúc (người dùng, đơn hàng, metadata sách) đảm bảo tính nhất quán ACID.

Vector Database (ChromaDB/Qdrant): Lưu trữ các vector embeddings để phục vụ tìm kiếm ngữ cảnh tốc độ cao cho AI.

Frontend (React/Tailwind CSS): Giao diện hiện đại, tối ưu trải nghiệm người dùng trên đa thiết bị.

🌟 Key Value Propositions (Giá trị khác biệt)
Độ chính xác cao: AI không trả lời dựa trên dữ liệu huấn luyện tự do mà bám sát vào "nguồn sự thật" là nội dung cuốn sách thông qua luồng Context Injection.

Vận hành đa vai trò: Hệ thống phân quyền chặt chẽ (RBAC) giữa Khách hàng, Quản trị viên (Admin) và Người kiểm duyệt nội dung (Content Curator).

Khả năng bảo trì: Codebase được thiết kế theo chuẩn hướng đối tượng (OOP) với các lớp thực thể (Book, Cart, Order) rõ ràng, sẵn sàng cho việc mở rộng quy mô lớn.

Smart Digital Library không chỉ bán sách, chúng tôi bán cách để bạn thấu hiểu tri thức nhanh hơn.