import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute: Bọc các trang cần kiểm tra quyền truy cập.
 * - Nếu chưa đăng nhập → chuyển về /login
 * - Nếu không đủ role → chuyển về /
 * - Nếu đủ điều kiện → hiển thị component con
 *
 * Usage:
 *   <ProtectedRoute roles={['ADMIN', 'CURATOR']}>
 *     <AdminDashboardPage />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useAuth();

  // Chưa đăng nhập → về trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng không đủ quyền → về trang chủ
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
