import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import Các Đài phát thanh (Context)
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Import Các Mảnh ghép (Component) và Trang (Pages)
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import BookDetailPage from './pages/BookDetailPage';
import CartPage from './pages/CartPage';
import ChatPage from './pages/ChatPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentResultPage from './pages/PaymentResultPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import MyShelfPage from './pages/MyShelfPage';
import WishlistPage from './pages/WishlistPage';
import NotificationsPage from './pages/NotificationsPage';
import Footer from './components/Footer';

// Khởi tạo React Query
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>

              <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Navbar */}
                <Navbar />

                {/* Nội dung thay đổi theo đường dẫn */}
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/books/:id" element={<BookDetailPage />} />
                  <Route path="/books/:id/chat" element={<ChatPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/payment-result" element={<PaymentResultPage />} />
                  <Route path="/orders" element={<OrderHistoryPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/shelf" element={<MyShelfPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/blog/:id" element={<ArticleDetailPage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute roles={['ADMIN', 'CURATOR']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<h1 className="text-center mt-20 text-2xl font-bold text-gray-500">404 - Không tìm thấy trang</h1>} />
                </Routes>

                {/* Global Footer */}
                <Footer />
              </div>

            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
