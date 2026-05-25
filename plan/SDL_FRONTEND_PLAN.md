# ⚛️ SDL Frontend - React Learning & Build Plan

**Approach:** Học React thông qua việc build SDL Frontend luôn  
**Timeline:** 4-6 tuần  
**Method:** Learn by doing - Học concept → Apply vào SDL ngay  
**Stack:** React + Vite + TailwindCSS + React Query + React Router

---

## 🎯 Triết lý học

```
❌ CÁCH SAI: Học React xong → rồi mới build SDL
✅ CÁCH ĐÚNG: Học concept → Apply vào SDL ngay hôm đó

Ví dụ:
- Học useState → Build Login Form của SDL ngay
- Học useEffect → Fetch danh sách sách ngay
- Học React Router → Setup routing cho SDL ngay
```

**Lý do:** Học gắn với context thực tế → nhớ lâu hơn 3-5 lần

---

## 🛠️ Tech Stack SDL Frontend

```
Core:
├── React 18          → UI Library
├── Vite              → Build tool (nhanh hơn CRA)
├── React Router v6   → Client-side routing
├── TailwindCSS       → Styling (nhanh, không cần CSS nhiều)
└── Axios             → HTTP client (gọi API)

State Management:
├── React Query       → Server state (fetch, cache API data)
└── Context API       → Client state (auth, cart)

UI Components:
├── shadcn/ui         → Component library đẹp sẵn
└── Lucide React      → Icons

Dev Tools:
├── ESLint + Prettier → Code quality
└── React DevTools    → Debug
```

**Tại sao stack này?**
- ✅ Vite: Nhanh hơn CRA 10-20x
- ✅ TailwindCSS: Không cần viết CSS, build UI nhanh
- ✅ React Query: Xử lý loading/error/cache tự động
- ✅ shadcn/ui: Components đẹp, copy-paste friendly

---

## 📋 Các Pages SDL Frontend cần build

```
PUBLIC PAGES (Không cần login):
├── / (Home)          → Trang chủ, featured books
├── /books            → Danh sách sách + filter/search
├── /books/:id        → Chi tiết sách
├── /login            → Đăng nhập
└── /register         → Đăng ký

CUSTOMER PAGES (Cần login):
├── /cart             → Giỏ hàng
├── /checkout         → Thanh toán
├── /orders           → Lịch sử đơn hàng
├── /orders/:id       → Chi tiết đơn hàng
├── /profile          → Hồ sơ cá nhân
└── /books/:id/chat   → Chat with Book ⭐ AI Feature

ADMIN PAGES:
├── /admin/dashboard  → Tổng quan
├── /admin/books      → Quản lý sách
├── /admin/orders     → Quản lý đơn hàng
└── /admin/users      → Quản lý người dùng

CURATOR PAGES:
└── /curator/upload   → Upload & index sách
```

---

## 📅 WEEK 1: React Fundamentals + Project Setup

**Goal:** Hiểu React cơ bản + Setup project SDL Frontend

---

### **Day 1: Hiểu React là gì & Setup**

**Concept cần học:**
```
1. React là gì?
   - Library để build UI
   - Component-based: Chia UI thành pieces nhỏ
   - Virtual DOM: React update UI thông minh

2. So sánh với HTML thuần:
   HTML thuần:              React:
   <div id="app">          function App() {
     <h1>Hello</h1>          return <h1>Hello</h1>
   </div>                  }
   document.getElementById → Không cần querySelector
   .innerHTML = "..."      → React tự update DOM
```

**Setup Project:**
```bash
# 1. Tạo project với Vite
npm create vite@latest sdl-frontend -- --template react
cd sdl-frontend

# 2. Install dependencies
npm install
npm install react-router-dom axios @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 3. Install UI components
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge

# 4. Chạy thử
npm run dev
```

**Cấu trúc folder:**
```
sdl-frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/            # Base UI (Button, Input, Card)
│   │   ├── layout/        # Header, Footer, Sidebar
│   │   └── features/      # Feature-specific components
│   │       ├── books/
│   │       ├── cart/
│   │       ├── auth/
│   │       └── chat/
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks
│   ├── services/          # API calls (axios)
│   ├── context/           # React Context (auth, cart)
│   ├── utils/             # Helper functions
│   └── App.jsx            # Root component
├── public/
├── index.html
└── vite.config.js
```

**Deliverable Day 1:**
- [ ] Project chạy được `npm run dev`
- [ ] Hiểu component là gì
- [ ] Tailwind setup hoạt động

---

### **Day 2: JSX & Components**

**Concept cần học:**

```jsx
// JSX = JavaScript + HTML syntax
// Rule 1: Return 1 root element
function BookCard({ title, author, price }) {
  return (
    <div className="border rounded p-4">   {/* className, không phải class */}
      <h2>{title}</h2>                      {/* {} để chạy JS */}
      <p>{author}</p>
      <span>{price.toLocaleString()} VND</span>
    </div>
  );
}

// Rule 2: Props = data truyền vào component
// Giống function parameters
<BookCard
  title="Python Guide"
  author="John Smith"
  price={299000}
/>

// Rule 3: children prop
function Card({ children }) {
  return <div className="card">{children}</div>;
}

<Card>
  <h1>Hello</h1>  {/* children */}
</Card>
```

**Build cho SDL:**
```jsx
// src/components/features/books/BookCard.jsx
function BookCard({ book }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <img
        src={book.coverImageUrl}
        alt={book.title}
        className="w-full h-48 object-cover rounded"
      />
      <h3 className="font-bold mt-2">{book.title}</h3>
      <p className="text-gray-500 text-sm">{book.author}</p>
      <p className="text-blue-600 font-semibold mt-2">
        {book.price.toLocaleString('vi-VN')} VND
      </p>
      <button className="w-full mt-3 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
        Thêm vào giỏ
      </button>
    </div>
  );
}

export default BookCard;
```

**Deliverable Day 2:**
- [ ] Hiểu JSX syntax
- [ ] Tạo BookCard component
- [ ] Hiểu props

---

### **Day 3: useState - Quản lý State**

**Concept cần học:**

```jsx
import { useState } from 'react';

// useState = lưu data có thể thay đổi
// Khi state thay đổi → React re-render component

function Counter() {
  const [count, setCount] = useState(0); // [giá trị, hàm update]

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}

// ⚠️ QUAN TRỌNG: Không mutate state trực tiếp!
// ❌ SAI:
count = count + 1;

// ✅ ĐÚNG:
setCount(count + 1);
```

**Build cho SDL - Login Form:**

```jsx
// src/pages/LoginPage.jsx
import { useState } from 'react';

function LoginPage() {
  // State cho form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn form reload page
    setLoading(true);
    setError('');

    try {
      // Sẽ thêm API call sau
      console.log('Login with:', { email, password });
    } catch (err) {
      setError('Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Đăng nhập</h1>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
```

**Deliverable Day 3:**
- [ ] Hiểu useState hook
- [ ] Build Login Form với state
- [ ] Handle form submit

---

### **Day 4: React Router - Navigation**

**Concept cần học:**

```jsx
// React Router: Điều hướng giữa các pages
// Không reload page (SPA - Single Page Application)

// src/App.jsx
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route path="/cart" element={
          <PrivateRoute>
            <CartPage />
          </PrivateRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// Link component (không dùng <a> trong React)
<Link to="/books">Xem sách</Link>

// useNavigate hook (programmatic navigation)
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/login');           // Điều hướng
navigate(-1);                 // Back

// useParams (lấy :id từ URL)
import { useParams } from 'react-router-dom';
const { id } = useParams();   // /books/5 → id = "5"
```

**Build cho SDL - App Router:**

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BooksPage from './pages/BooksPage';
import BookDetailPage from './pages/BookDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/admin/DashboardPage';
import PrivateRoute from './components/layout/PrivateRoute';
import AdminRoute from './components/layout/AdminRoute';
import Header from './components/layout/Header';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/cart" element={
            <PrivateRoute><CartPage /></PrivateRoute>
          } />
          <Route path="/books/:id/chat" element={
            <PrivateRoute><ChatPage /></PrivateRoute>
          } />

          <Route path="/admin/dashboard" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
```

**Deliverable Day 4:**
- [ ] Hiểu React Router
- [ ] Setup routing cho SDL
- [ ] Build Header với navigation links

---

### **Day 5: useEffect & API Calls**

**Concept cần học:**

```jsx
import { useState, useEffect } from 'react';

// useEffect = side effects
// Chạy sau khi component render

// Fetch data khi component mount
useEffect(() => {
  fetchBooks();
}, []); // [] = chỉ chạy 1 lần khi mount

// Fetch khi dependency thay đổi
useEffect(() => {
  fetchBooksByCategory(categoryId);
}, [categoryId]); // Chạy lại khi categoryId đổi

// Cleanup (event listeners, timers)
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer); // cleanup
}, []);
```

**Build cho SDL - Fetch Books:**

```jsx
// src/services/bookService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Auto attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookService = {
  getBooks: (params) => api.get('/books', { params }),
  getBook: (id) => api.get(`/books/${id}`),
  createBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),
};

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/add', data),
  removeItem: (bookId) => api.delete(`/cart/remove/${bookId}`),
};

export const chatService = {
  askQuestion: (data) => api.post('/chat/ask', data),
  getSessions: () => api.get('/chat/sessions'),
};
```

```jsx
// src/pages/BooksPage.jsx
import { useState, useEffect } from 'react';
import { bookService } from '../services/bookService';
import BookCard from '../components/features/books/BookCard';

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBooks();
  }, [search]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookService.getBooks({ search });
      setBooks(response.data.data);
    } catch (err) {
      setError('Không thể tải danh sách sách');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Đang tải...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar */}
      <input
        type="text"
        placeholder="Tìm kiếm sách..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-4 py-2 mb-6"
      />

      {/* Books grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}

export default BooksPage;
```

**Deliverable Day 5:**
- [ ] Hiểu useEffect
- [ ] Setup axios + API service
- [ ] Fetch & hiển thị danh sách sách

---

### **Day 6-7: Context API - Auth State**

**Concept cần học:**

```jsx
// Context = global state, tránh prop drilling
// Dùng cho: Auth (user, token), Cart count, Theme

// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check if user logged in on mount
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data.user);
    } catch {
      logout(); // Token expired
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const { user, token } = response.data;

    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);

    return user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Deliverable Day 6-7:**
- [ ] Hiểu Context API
- [ ] Build AuthContext
- [ ] Login/Logout working
- [ ] Protected routes working

---

## 📅 WEEK 2: Core Pages

**Goal:** Build tất cả pages cơ bản

### Pages cần build:
- [ ] HomePage - Featured books, hero section
- [ ] BooksPage - Grid + search + filter
- [ ] BookDetailPage - Chi tiết + add to cart
- [ ] LoginPage - Form + API integration
- [ ] RegisterPage - Form + API
- [ ] Header - Navigation + cart count + user menu

### Key concepts tuần này:
- React Query cho data fetching (thay thế useEffect)
- Custom hooks
- Error boundaries
- Loading states

**React Query (quan trọng!):**

```jsx
// Thay vì useEffect + useState phức tạp:
const [books, setBooks] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => { fetchBooks() }, []);

// Dùng React Query:
import { useQuery } from '@tanstack/react-query';

const { data: books, isLoading, error } = useQuery({
  queryKey: ['books', search],
  queryFn: () => bookService.getBooks({ search }),
});

// React Query tự động:
// ✅ Cache data
// ✅ Refetch khi focus tab
// ✅ Loading/error states
// ✅ Retry on failure
```

---

## 📅 WEEK 3: Cart & Checkout

**Goal:** E-commerce flow hoàn chỉnh

### Pages cần build:
- [ ] CartPage - Items + total + checkout button
- [ ] CheckoutPage - Address + payment method
- [ ] OrderConfirmationPage - Success message
- [ ] OrdersPage - Order history

### Key feature:
```jsx
// src/context/CartContext.jsx
// Cart Context: Track items, total, count

// Khi add to cart:
// 1. Call API POST /cart/add
// 2. Update local cart state
// 3. Show notification

// Cart count in Header (badge)
function Header() {
  const { cartCount } = useCart();

  return (
    <nav>
      <Link to="/cart" className="relative">
        🛒
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
```

---

## 📅 WEEK 4: Chat with Book ⭐ AI Feature

**Goal:** Build Chat UI kết nối với FastAPI

### Đây là feature ấn tượng nhất!

```jsx
// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/chatService';

function ChatPage() {
  const { id: bookId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'USER', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatService.askQuestion({
        bookId,
        query: input,
      });

      const aiMessage = {
        role: 'ASSISTANT',
        content: response.data.answer,
        sources: response.data.sources,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ASSISTANT',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] p-3 rounded-lg ${
              msg.role === 'USER'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p>{msg.content}</p>
              {msg.sources && (
                <p className="text-xs mt-1 opacity-70">
                  Nguồn: {msg.sources.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <span className="animate-pulse">AI đang trả lời...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Đặt câu hỏi về cuốn sách..."
          className="flex-1 border rounded px-4 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
```

---

## 📅 WEEK 5: Admin Dashboard

**Goal:** Admin panel cho quản lý

### Pages:
- [ ] Dashboard - Charts, stats
- [ ] Books Management - CRUD table
- [ ] Orders Management - Status update
- [ ] Users Management - List, deactivate

### Key component:
```jsx
// Data table với sort/filter/pagination
// Charts với recharts library

import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

function RevenueChart({ data }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="revenue" fill="#3b82f6" />
    </BarChart>
  );
}
```

---

## 📅 WEEK 6: Polish, Testing & Connect to Backend

**Goal:** Hoàn thiện, test, connect backend thật

### Tasks:
- [ ] Error handling toàn diện
- [ ] Loading states đẹp
- [ ] Empty states
- [ ] Responsive design (mobile)
- [ ] Form validation
- [ ] Toast notifications
- [ ] Connect tất cả API endpoints

### Environment config:
```bash
# .env.development
VITE_API_URL=http://localhost:3000/api
VITE_AI_API_URL=http://localhost:8000/api

# .env.production
VITE_API_URL=https://your-api.railway.app/api
VITE_AI_API_URL=https://your-ai-api.railway.app/api
```

---

## ✅ Complete Frontend Checklist

### Setup
- [ ] Vite + React project created
- [ ] TailwindCSS configured
- [ ] React Router setup
- [ ] Axios + API services
- [ ] React Query setup
- [ ] Environment variables

### Auth
- [ ] AuthContext working
- [ ] Login page + API
- [ ] Register page + API
- [ ] Protected routes
- [ ] JWT token stored + attached
- [ ] Logout working

### Books
- [ ] Books list page
- [ ] Search & filter
- [ ] Book detail page
- [ ] Categories filter

### Cart
- [ ] Cart page
- [ ] Add/remove items
- [ ] Cart count in header
- [ ] CartContext

### Checkout
- [ ] Checkout page
- [ ] Order confirmation
- [ ] Order history

### Chat with Book ⭐
- [ ] Chat UI
- [ ] Send/receive messages
- [ ] Loading state
- [ ] Sources display
- [ ] Like/dislike feedback

### Admin
- [ ] Dashboard with stats
- [ ] Books CRUD table
- [ ] Orders management
- [ ] Users management

### Polish
- [ ] Responsive (mobile-friendly)
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Toast notifications
- [ ] 404 page

---

## 📚 Learning Resources

### React Core
- React Docs: https://react.dev/ (Official, rất tốt)
- React Router: https://reactrouter.com/
- React Query: https://tanstack.com/query/latest

### Styling
- TailwindCSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/

### Axios
- Axios Docs: https://axios-http.com/docs/intro

### YouTube (Tiếng Anh):
- Codevolution - React Tutorial
- The Net Ninja - React
- Jack Herrington - React

---

## 🎯 Milestone Summary

```
Cuối Week 1: Có Login + Books list + Routing
Cuối Week 2: Tất cả public pages hoạt động
Cuối Week 3: Cart + Checkout flow đầy đủ
Cuối Week 4: Chat with Book working ⭐
Cuối Week 5: Admin dashboard
Cuối Week 6: Full-stack app hoàn chỉnh, sẵn sàng deploy
```

---

## 🚀 Sau khi Frontend hoàn thành

```
Frontend Done
      ↓
Deploy Backend (Railway/Render)
      ↓
Deploy Frontend (Vercel - miễn phí)
      ↓
Full-stack SDL live trên internet! 🎉
```

**Portfolio URL sẽ có:**
- Frontend: `https://sdl-app.vercel.app`
- Backend API: `https://sdl-api.railway.app`
- AI Service: `https://sdl-ai.railway.app`

---

*Generated: 2026-05-18*
*Total: 6 weeks React learning plan tailored for SDL*
