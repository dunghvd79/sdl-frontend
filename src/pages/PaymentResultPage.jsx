import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function PaymentResultPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get('status');
  const isSuccess = status === 'success';

  return (
    <div className="max-w-md mx-auto py-20 px-4 flex-grow w-full flex flex-col justify-center">
      <div className="bg-white border border-divider rounded-none p-10 text-center shadow-none">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 border border-[#2C4A3B] rounded-full flex items-center justify-center mx-auto mb-6 text-[#2C4A3B] text-2xl font-light">
              ✓
            </div>
            <h1 className="text-2xl font-serif font-medium text-ink mb-4">THANH TOÁN THÀNH CÔNG</h1>
            <p className="text-ink-light text-sm mb-10 leading-relaxed">
              Cảm ơn bạn đã mua hàng! Thanh toán giả lập đã được xác nhận thành công. Bạn đã có quyền đọc sách và trò chuyện AI RAG cùng tác phẩm này.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 border border-ink-light rounded-full flex items-center justify-center mx-auto mb-6 text-ink-light text-2xl font-light">
              ✕
            </div>
            <h1 className="text-2xl font-serif font-medium text-ink mb-4">THANH TOÁN THẤT BẠI</h1>
            <p className="text-ink-light text-sm mb-10 leading-relaxed">
              Giao dịch đã bị hủy hoặc không thành công. Đơn hàng của bạn vẫn được lưu lại dưới trạng thái <strong>Chờ thanh toán</strong> để thanh toán lại sau.
            </p>
          </>
        )}

        <div className="space-y-3">
          <Link
            to="/orders"
            className="block w-full bg-ink hover:bg-ink-light text-white font-medium py-3 px-4 rounded-none transition-colors text-sm uppercase tracking-wider"
          >
            Xem Đơn Hàng Của Tôi
          </Link>
          <Link
            to="/"
            className="block w-full bg-surface-warm hover:bg-[#f0ece7] text-ink border border-divider font-medium py-3 px-4 rounded-none transition-colors text-sm uppercase tracking-wider"
          >
            Quay lại Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
