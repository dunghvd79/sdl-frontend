# 🎓 Smart Digital Library (SDL) - Claude Project Instructions

**Project Status:** Planning & Design Phase  
**Team:** Solo Developer (Learning)  
**Learning Focus:** FastAPI, Node.js, Microservices Architecture  
**Last Updated:** 2026-05-06

---

## 📑 Mục lục

1. [Tổng quan dự án](#-project-overview)
2. [Kiến trúc kỹ thuật](#-technical-architecture)
3. [Cấu trúc thư mục](#-project-structure)
4. [Models & Entities](#-key-models--entities)
5. [Security & Authentication](#-security--authentication)
6. [Workflows & Sequences](#-key-workflows--sequences)
7. [Development Standards](#-development-standards)
8. [Learning Path](#-learning-path--recommendations)
9. [Khi cần giúp đỡ](#-when-helping-with-sdl-development)
10. [Configuration & Environment](#-configuration--environment)
11. [Development Workflow](#-development-workflow)
12. [Documentation Requirements](#-documentation-requirements)
13. [Integration Points](#-integration-points)
14. [Feature Checklist](#-checklist-for-each-feature)
15. [Learning Resources](#-learning-resources)

---

## 📌 Project Overview

**Smart Digital Library** là hệ thống thư viện số thông minh kết hợp:
- **E-commerce** (Mua bán, quản lý kho)
- **AI-Driven RAG** (Chat with Books, Semantic Search)
- **Microservices Architecture** (Node.js + FastAPI + PostgreSQL + Vector DB)

**Core Value:** Người dùng không chỉ mua sách, mà tương tác với kiến thức thông qua AI.

### Tính năng chính:
- 📚 Duyệt và mua sách điện tử
- 🛒 Quản lý giỏ hàng, đặt hàng, thanh toán
- 💬 Chat trực tiếp với nội dung sách (RAG)
- 🔍 Tìm kiếm ngữ nghĩa thông minh
- 👥 Quản lý người dùng và phân quyền
- 📊 Dashboard quản lý admin

---

## 🏗️ Technical Architecture

### Backend Services

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
└────────────┬────────────────────────┬────────────────────┘
             │                        │
      ┌──────▼──────┐       ┌────────▼──────┐
      │  Node.js    │       │  Python/Fast- │
      │  Express    │       │  API (AI)     │
      │  API        │       │  Service      │
      │  Gateway    │       │               │
      └──────┬──────┘       └────────┬──────┘
             │                      │
             │    ┌─────────────────┘
             │    │
      ┌──────▼────▼─────┐
      │   PostgreSQL    │  (Structured Data)
      │   Users, Orders,│
      │   Inventory     │
      └─────────────────┘
      
      ┌─────────────────┐
      │ ChromaDB/Qdrant │  (Vector Embeddings)
      │   for RAG       │
      └─────────────────┘
```

### Service Responsibilities

#### **Node.js/Express Backend**
- User Authentication & Authorization (JWT)
- User Profile Management
- Shopping Cart Operations
- Order Management (Create, Update, Track)
- Inventory Management (Hold/Release mechanisms)
- Payment Processing Integration
- Admin Dashboard APIs

#### **Python/FastAPI AI Service**
- PDF/EPUB Document Processing
- Text Extraction & Chunking
- Embedding Generation (OpenAI/HuggingFace)
- Vector Store Management (ChromaDB/Qdrant)
- Semantic Search Implementation
- RAG Query Processing
- Chat with Book Functionality
- Response Generation with Context Injection

#### **Databases**
- **PostgreSQL:** Relational data (Users, Orders, Books, Cart, Inventory)
- **Vector DB:** Embeddings for semantic search (ChromaDB/Qdrant)

---

## 🗂️ Project Structure

```
SDL/
├── docs/
│   ├── SRS.md                    # System Requirement Specification
│   ├── use_cases.md              # Use Case Diagrams & Descriptions
│   ├── class_diagrams.md         # UML Class Diagrams
│   ├── sequence_diagrams.md      # Sequence Diagrams
│   └── database_schema.md        # Database Design
│
├── backend-nodejs/
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── services/             # Business logic
│   │   ├── models/               # Data models
│   │   ├── routes/               # API endpoints
│   │   ├── middleware/           # Auth, error handling
│   │   ├── utils/                # Helper functions
│   │   ├── constants/            # Constants
│   │   └── config/               # Configuration
│   ├── tests/
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── ai-service-python/
│   ├── src/
│   │   ├── api/
│   │   │   └── routes/           # FastAPI endpoints
│   │   ├── services/
│   │   │   ├── embedding.py      # Embedding service
│   │   │   ├── vector_db.py      # Vector DB operations
│   │   │   ├── rag_pipeline.py   # RAG implementation
│   │   │   └── document_processor.py
│   │   ├── models/               # Pydantic models
│   │   ├── utils/                # Helper functions
│   │   ├── config/               # Configuration
│   │   └── constants/            # Constants
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/                     # React (separate project)
│
└── README.md                     # Project root README
```

---

## 🔌 Key Models & Entities

### **User & Authentication**
```python
User:
  - id (PK)
  - email (unique)
  - password_hash
  - full_name
  - role (CUSTOMER, ADMIN, CURATOR)
  - created_at
  - updated_at
```

### **Book Management**
```python
Book:
  - id (PK)
  - title
  - author
  - isbn
  - description
  - price
  - stock_quantity
  - pdf_url / epub_url
  - created_at
  - updated_at

Category (1:Many with Book):
  - id (PK)
  - name
  - description
```

### **Shopping & Orders**
```python
Cart:
  - id (PK)
  - user_id (FK)
  - items (CartItem[])
  - created_at

CartItem:
  - id (PK)
  - cart_id (FK)
  - book_id (FK)
  - quantity
  - added_at

Order:
  - id (PK)
  - user_id (FK)
  - status (PENDING, CONFIRMED, PROCESSING, COMPLETED)
  - total_amount
  - items (OrderItem[])
  - created_at
  - updated_at

OrderItem:
  - id (PK)
  - order_id (FK)
  - book_id (FK)
  - quantity
  - unit_price
  - subtotal

Inventory (Hold/Release Mechanism):
  - id (PK)
  - book_id (FK)
  - available_qty
  - reserved_qty (Hold during checkout)
  - last_updated
```

### **AI & RAG**
```python
Document (Vector DB):
  - id (unique)
  - book_id (reference)
  - chunk_index
  - content (text chunk)
  - embedding (vector)
  - metadata (page_no, section, etc)
  - created_at

ChatSession:
  - id (PK)
  - user_id (FK)
  - book_id (FK)
  - messages (Message[])
  - created_at

Message:
  - id (PK)
  - session_id (FK)
  - role (USER, ASSISTANT)
  - content
  - retrieved_context (for RAG)
  - created_at
```

---

## 🔐 Security & Authentication

### **Authentication Strategy**
- **Method:** JWT (JSON Web Tokens)
- **Flow:**
  1. User login → Node.js generates JWT
  2. JWT sent in Authorization header for subsequent requests
  3. Token refresh mechanism (access + refresh tokens)

### **Authorization (RBAC)**
```
Roles:
├── CUSTOMER
│   ├── Browse books
│   ├── Purchase books
│   ├── Chat with books
│   └── View own orders
├── ADMIN
│   ├── Manage users
│   ├── Manage inventory
│   ├── View all orders
│   └── System configuration
└── CONTENT_CURATOR
    ├── Upload/edit books
    ├── Manage categories
    └── Content moderation
```

### **Security Best Practices**
- ✅ Hash passwords (bcrypt)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input validation (Pydantic for FastAPI)
- ✅ SQL injection prevention (ORM + parameterized queries)
- ✅ XSS protection
- ✅ Environment variables for secrets (.env files)

---

## 🔄 Key Workflows & Sequences

### **1. Order Placement (Concurrency Control)**

```
User Flow:
1. Add item to cart → Update Cart
2. Checkout → Validate inventory
3. Hold inventory (Reserve qty)
4. Process payment
5. Release hold → Create Order
6. Update available stock

Critical: Prevent double-selling with Hold/Release mechanism
```

### **2. Chat with Book (RAG Pipeline)**

```
User Flow:
1. User asks question about book
2. FastAPI receives query
3. Generate embedding from query
4. Search vector DB for similar chunks
5. Retrieve top-k relevant chunks
6. Inject context into LLM prompt
7. Generate response based on context
8. Return answer to user

Response Time Target: < 3 seconds
```

### **3. Document Processing (PDF → RAG)**

```
When admin uploads new book PDF:
1. PDF received by FastAPI
2. Extract text content
3. Split into chunks (sliding window)
4. Generate embeddings for each chunk
5. Store vectors in ChromaDB/Qdrant
6. Update book metadata
7. Ready for chat queries
```

---

## 💻 Development Standards

### **Node.js/Express Standards**

#### Code Style
- **Standard:** Follow Express.js best practices
- **Linting:** ESLint + Prettier
- **Naming Convention:**
  - `camelCase` for variables, functions
  - `PascalCase` for classes, components
  - `UPPER_SNAKE_CASE` for constants

#### Project Structure Pattern
```javascript
// routes/books.js - API endpoints
router.get('/books', getBooks);
router.get('/books/:id', getBookById);
router.post('/books', createBook);

// controllers/bookController.js - Request handlers
const getBooks = async (req, res) => {
  // Validate input
  // Call service
  // Send response
};

// services/bookService.js - Business logic
const getBooks = async (filters) => {
  // Query database
  // Apply business rules
  // Return processed data
};

// models/Book.js - Data model/schema
class Book {
  constructor(id, title, author, price) { ... }
  validate() { ... }
  toJSON() { ... }
}
```

#### Express Patterns
- ✅ Use middleware for auth, logging, error handling
- ✅ Separate concerns (routes → controllers → services)
- ✅ Validate inputs with middleware/library (joi, express-validator)
- ✅ Proper error handling with custom error classes
- ✅ Async/await for database operations
- ✅ Connection pooling for database

### **Python/FastAPI Standards**

#### Code Style
- **Standard:** PEP 8 + Black formatter
- **Linting:** Pylint, Flake8
- **Type Hints:** Always use (FastAPI relies on them)
- **Naming Convention:**
  - `snake_case` for variables, functions
  - `PascalCase` for classes, Pydantic models
  - `UPPER_SNAKE_CASE` for constants

#### FastAPI Project Structure
```python
# main.py - App initialization
from fastapi import FastAPI
app = FastAPI()

# routes/chat.py - API endpoints
@router.post("/chat/ask")
async def ask_question(query: QueryRequest) -> QueryResponse:
    # Validate using Pydantic
    # Call service
    # Return response

# services/rag_service.py - Business logic
async def retrieve_relevant_chunks(query: str, book_id: str, top_k: int = 5):
    """
    Retrieve relevant chunks from vector DB
    using semantic search.
    """
    # Generate embedding
    # Search vector DB
    # Return ranked results

# models/schemas.py - Pydantic models for validation
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    book_id: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float
```

#### FastAPI Patterns
- ✅ Use dependency injection for services, database
- ✅ Pydantic models for request/response validation
- ✅ Async/await for I/O operations
- ✅ Proper HTTP status codes (200, 400, 404, 500)
- ✅ Docstrings for all endpoints
- ✅ Logging for debugging
- ✅ Exception handling with custom exceptions

### **Database Standards**

#### PostgreSQL (Node.js)
- Use ORM (e.g., Sequelize, TypeORM)
- Foreign key constraints for data integrity
- Indexes on frequently queried columns
- Connection pooling
- Transaction handling for multi-step operations

#### Vector Database (Python)
- Use ChromaDB or Qdrant client library
- Batch operations for performance
- Proper error handling
- Metadata storage for retrieval context

### **Testing Standards**

#### Node.js
- **Framework:** Jest or Mocha + Chai
- **Types:** Unit tests, Integration tests
- **Coverage Target:** 80%+
- **Pattern:** Test business logic in services

```javascript
describe('BookService', () => {
  it('should retrieve books with filters', async () => {
    // Arrange
    const mockBooks = [{ id: 1, title: 'Book 1' }];
    
    // Act
    const result = await bookService.getBooks({ category: 'Fiction' });
    
    // Assert
    expect(result).toEqual(mockBooks);
  });
});
```

#### Python/FastAPI
- **Framework:** Pytest
- **Types:** Unit tests, Integration tests
- **Coverage Target:** 80%+
- **Pattern:** Test endpoints and services

```python
@pytest.mark.asyncio
async def test_ask_question():
    # Arrange
    client = TestClient(app)
    query = QueryRequest(query="What is AI?", book_id="123")
    
    # Act
    response = client.post("/chat/ask", json=query.dict())
    
    # Assert
    assert response.status_code == 200
    assert "answer" in response.json()
```

---

## 🎓 Learning Path & Recommendations

### **Phase 1: FastAPI Fundamentals (Current Focus)**
Recommended order:
1. ✅ Understand async/await in Python
2. ✅ Learn Pydantic models (validation)
3. ✅ Create basic FastAPI endpoints
4. ✅ Implement dependency injection
5. ✅ Database integration (SQLAlchemy/async)
6. ✅ Error handling & status codes
7. ✅ Testing with Pytest

### **Phase 2: RAG Implementation (Next)**
1. ✅ Document processing (PDF extraction)
2. ✅ Text chunking strategies
3. ✅ Embedding generation (OpenAI/Hugging Face)
4. ✅ Vector DB integration (ChromaDB)
5. ✅ Semantic search implementation
6. ✅ Context injection for LLM
7. ✅ Performance optimization

### **Phase 3: Node.js/Express Backend**
1. ✅ Express.js fundamentals
2. ✅ Routing & middleware
3. ✅ Service layer pattern
4. ✅ Database integration (Sequelize)
5. ✅ Authentication (JWT)
6. ✅ Error handling
7. ✅ Testing

### **Phase 4: Integration & Optimization**
1. ✅ Microservices communication
2. ✅ Concurrency control (Order processing)
3. ✅ Performance testing
4. ✅ Deployment preparation

---

## 🎯 When Helping With SDL Development

### **Code Examples**
- ✅ Provide **both Node.js and Python examples** when relevant
- ✅ Show FastAPI + async patterns
- ✅ Show Express.js + middleware patterns
- ✅ Explain why certain patterns chosen

### **Best Practices**
- ✅ Highlight PEP 8 (Python) and ESLint (Node.js) compliance
- ✅ Emphasize type hints (FastAPI) and JSDoc (Node.js)
- ✅ Suggest testing approaches
- ✅ Point out concurrency/performance considerations

### **Architecture Focus**
- ✅ Explain service responsibilities
- ✅ Show data flow between services
- ✅ Discuss scalability implications
- ✅ Suggest caching strategies

### **Common Mistakes to Highlight**
- ❌ Not handling concurrency in inventory operations
- ❌ Not validating user inputs (security)
- ❌ Ignoring error handling
- ❌ Not using async/await properly
- ❌ N+1 query problems in database
- ❌ Inefficient vector search queries

### **Documentation to Create**
- 📝 Sequence diagrams for workflows
- 📝 API endpoint specifications
- 📝 Database schema with constraints
- 📝 Environment configuration examples
- 📝 Setup/Installation guides

---

## ⚙️ Configuration & Environment

### **Required Environment Variables**

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/sdl_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# Vector DB
VECTOR_DB_HOST=localhost
VECTOR_DB_PORT=6333

# OpenAI/LLM
OPENAI_API_KEY=sk-xxx

# File Upload
MAX_UPLOAD_SIZE=50MB
UPLOAD_DIR=/uploads

# Node.js Service
NODE_PORT=3000
NODE_ENV=development

# FastAPI Service
FASTAPI_PORT=8000
FASTAPI_ENV=development

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379
```

---

## 🚀 Development Workflow

### **For Design Phase (Current)**
1. ✅ Review SRS requirements
2. ✅ Validate class diagrams against requirements
3. ✅ Verify sequence diagrams for all workflows
4. ✅ Design database schema with constraints
5. ✅ Plan API endpoints with request/response models
6. ✅ Identify concurrency challenges
7. ✅ Plan testing strategy

### **For Development Phase (Next)**
1. ✅ Set up project structure
2. ✅ Configure databases (PostgreSQL + Vector DB)
3. ✅ Implement data models
4. ✅ Implement service layer (business logic)
5. ✅ Create API endpoints
6. ✅ Add authentication/authorization
7. ✅ Implement error handling
8. ✅ Write tests
9. ✅ Optimize performance

---

## 📖 Documentation Requirements

Every component should include:
```markdown
# Component/Feature Name

## Purpose
What does this component do?

## Responsibilities
What is it responsible for?

## Relationships
How does it interact with other components?

## Error Cases
What can go wrong?

## Performance Considerations
Any performance implications?

## Testing Strategy
How to test this component?
```

---

## 🔗 Integration Points

### **Node.js → FastAPI Communication**
```javascript
// When user asks question about a book
const askAboutBook = async (bookId, question) => {
  const response = await fetch('http://localhost:8000/api/chat/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, query: question })
  });
  return response.json();
};
```

### **FastAPI → PostgreSQL**
```python
# Query user's books for context
user_books = await db.query(Book).filter(
    Book.user_id == user_id
).all()
```

### **FastAPI → Vector DB**
```python
# Semantic search in vector DB
results = vector_db.query(
    query_embedding=embedding,
    n_results=5,
    where={"book_id": book_id}
)
```

---

## ✅ Checklist for Each Feature

- [ ] Requirements understood and documented
- [ ] Database schema designed
- [ ] Pydantic models (FastAPI) / Types (Node.js) defined
- [ ] API endpoints designed (request/response)
- [ ] Service logic designed
- [ ] Error cases identified
- [ ] Security considerations addressed
- [ ] Performance implications analyzed
- [ ] Tests designed
- [ ] Documentation updated

---

## 📞 When to Ask Claude

### **✅ Good questions:**
- "How to implement concurrency control in inventory management?"
- "What's the best RAG chunking strategy?"
- "How to optimize semantic search performance?"
- "Show me FastAPI + async patterns for this use case"
- "Debug this sequence diagram for order placement"
- "Design this database table relationship"

### **❌ Avoid:**
- Generic coding questions without SDL context
- Questions about other projects
- Off-topic questions

---

## 🎓 Learning Resources

### **FastAPI**
- Official Docs: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/
- AsyncIO: https://docs.python.org/3/library/asyncio.html

### **Node.js/Express**
- Official Docs: https://expressjs.com/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices

### **Architecture**
- Microservices: https://microservices.io/
- RAG: https://python.langchain.com/docs/modules/data_connection/
- Vector DB: https://www.qdrant.tech/documentation/

### **Databases**
- PostgreSQL: https://www.postgresql.org/docs/
- ChromaDB: https://docs.trychroma.com/

---

## 📝 Summary

**SDL** is an ambitious project combining E-commerce, AI/RAG, and Microservices. As a fresher developer, you'll learn:

✅ **FastAPI:** Async Python, dependency injection, Pydantic validation  
✅ **Node.js:** Express.js patterns, middleware, service architecture  
✅ **Microservices:** Service communication, data consistency  
✅ **Databases:** PostgreSQL relationships, Vector DBs for AI  
✅ **AI/ML:** RAG pipeline, embeddings, semantic search  
✅ **System Design:** Concurrency, performance optimization  

Focus on **understanding the WHY** behind each design decision. Good luck! 🚀

---

**Last Updated:** May 6, 2026  
**Next Review:** After completing Design Phase
