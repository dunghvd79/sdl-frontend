import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../services/image';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Heart, ShoppingCart } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

// 1. DỮ LIỆU ĐẦU VÀO: Component nhận thông tin 1 cuốn sách ('book') để vẽ card
export default function BookCard({ book }) {
  // 1. Kéo hàm addToCart từ kho lưu trữ giỏ hàng (Context)
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showQuickView, setShowQuickView] = useState(false);
  const [showLoginConfirm, setShowLoginConfirm] = useState(false);

  // Fetch wishlist to see if this book is liked
  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => api.get('/wishlists').then(r => r.data.data),
    enabled: !!user
  });

  const isLiked = Array.isArray(wishlist) && wishlist.some(item => String(item.id) === String(book.id));

  // Toggle wishlist item
  const toggleWishlistMutation = useMutation({
    mutationFn: () => api.post('/wishlists/toggle', { bookId: book.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myWishlist']);
    }
  });

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setShowLoginConfirm(true);
      return;
    }
    toggleWishlistMutation.mutate();
  };
  
  // 2. Xử lý dữ liệu
  const defaultImage = book.cover_url 
    ? getImageUrl(book.cover_url) 
    : `https://picsum.photos/seed/${book.id + 10}/800/1000`;
  const categoryName = book.categories && book.categories.length > 0 ? book.categories[0].name : 'Tác phẩm';
  const priceFormatted = Number(book.price).toLocaleString('vi-VN');
  
  // Xử lý hiển thị tồn kho (Dựa trên backend trả về available_qty)
  const availableQty = book.available_qty !== undefined ? book.available_qty : 0;

  // Generate stable mock rating & reviews based on book id
  const rating = ((book.id % 5) * 0.1 + 4.5).toFixed(1);
  const reviews = (book.id * 17) % 500 + 40;

  return (
    <div className="flex flex-col group relative bg-white border border-stone-200/60 rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(44,74,59,0.06)] hover:border-[#2C4A3B]/15 transition-all duration-300 select-none text-left h-full">
      
      {/* Cover Image Wrapper inside container */}
      <div className="w-full aspect-[4/5.2] overflow-hidden rounded-xl mb-4 relative bg-stone-50 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <Link to={`/books/${book.id}`} className="block w-full h-full cursor-pointer">
          <img 
            src={defaultImage} 
            alt={book.title} 
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-103" 
            loading="lazy"
          />
        </Link>

        {/* Hover "Xem nhanh" overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex items-center justify-center z-10 pointer-events-none">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickView(true);
            }}
            className="pointer-events-auto bg-white/95 backdrop-blur-xs text-stone-900 text-[10px] font-sans font-bold uppercase tracking-widest px-5 py-2.5 hover:bg-[#2C4A3B] hover:text-white transition-all duration-300 shadow-md cursor-pointer hover:scale-105 active:scale-95 border-0"
          >
            Xem nhanh
          </button>
        </div>
        
        {/* Decorative Bestseller Badge */}
        {book.is_bestseller && (
          <div className="absolute top-3 left-3 bg-[#2C4A3B] text-white text-[8px] uppercase tracking-[0.2em] font-bold px-2 py-0.5 shadow-sm">
            Bestseller
          </div>
        )}

        {/* Heart/Like Toggle Button */}
        <button 
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-xs p-2 rounded-full hover:bg-white text-stone-600 hover:text-[#2C4A3B] shadow-xs hover:shadow-sm transition-all z-20 cursor-pointer flex items-center justify-center border-0"
          title={isLiked ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
        >
          <Heart size={14} fill={isLiked ? "#2C4A3B" : "none"} stroke={isLiked ? "#2C4A3B" : "currentColor"} className="transition-transform duration-300 active:scale-125" />
        </button>
      </div>
      
      {/* Typographic details */}
      <div className="flex-grow flex flex-col justify-between">
        <div className="text-left">
          {/* Category name tag */}
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#c5a880] mb-1.5 block">
            {categoryName}
          </span>
          
          {/* Book Title */}
          <Link to={`/books/${book.id}`} className="font-serif text-sm font-bold text-stone-900 leading-snug hover:text-[#2C4A3B] transition-colors line-clamp-1 mb-1 block cursor-pointer">
            {book.title}
          </Link>
          
          {/* Author */}
          <span className="text-[10px] font-sans text-stone-500 block mb-2">
            {book.author}
          </span>

          {/* Gold Star Rating Block */}
          <div className="flex items-center gap-1.5 mb-3 text-[10px]">
            <div className="flex text-[#c5a880] tracking-tighter">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="leading-none mt-0.5">{i < Math.round(rating) ? '★' : '☆'}</span>
              ))}
            </div>
            <span className="font-bold text-stone-700 leading-none mt-0.5">{rating}</span>
            <span className="text-stone-400 font-sans text-[9px] leading-none mt-0.5">({reviews})</span>
          </div>
        </div>

        {/* Separator line and purchase controls */}
        <div>
          <div className="border-t border-stone-100 pt-3.5 flex items-center justify-between gap-3 w-full">
            <div className="flex flex-col text-left">
              {/* Price */}
              <span className="text-sm font-serif font-bold text-stone-900 leading-none">
                {priceFormatted} đ
              </span>
              {/* Inventory status label */}
              <div className="mt-1.5">
                {availableQty > 0 ? (
                  <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-150/50 px-1.5 py-0.5 rounded-sm">
                    Còn {availableQty} quyển
                  </span>
                ) : (
                  <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-150/50 px-1.5 py-0.5 rounded-sm">
                    Hết hàng
                  </span>
                )}
              </div>
            </div>

            {/* Square Add to Cart Button with Plus Icon */}
            <button 
              onClick={() => addToCart(book.id, book.title)}
              disabled={book.available_qty <= 0}
              className="w-8 h-8 rounded-lg bg-[#2C4A3B] hover:bg-[#1e3529] active:scale-95 text-white flex items-center justify-center shadow-xs transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer border-0 p-0"
              title="Thêm vào giỏ"
            >
              <svg className="w-3.5 h-3.5 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Login Prompt Confirm Modal */}
      <ConfirmDialog
        isOpen={showLoginConfirm}
        title="Yêu cầu đăng nhập"
        message="Vui lòng đăng nhập để lưu cuốn sách này vào danh sách yêu thích cá nhân của bạn."
        confirmText="Đăng nhập ngay"
        cancelText="Quay lại"
        variant="primary"
        onConfirm={() => navigate('/login', { state: { from: `/` } })}
        onCancel={() => setShowLoginConfirm(false)}
      />

      {/* Quick View Modal Overlay */}
      {showQuickView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          {/* Backdrop close */}
          <div className="absolute inset-0 cursor-default" onClick={(e) => { e.stopPropagation(); setShowQuickView(false); }}></div>

          {/* Modal Container */}
          <div 
            className="relative bg-white rounded-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-3xl overflow-hidden flex flex-col md:flex-row z-10 border border-stone-200/60"
            style={{ animation: 'scaleIn 0.25s cubic-bezier(.21,1.02,.73,1) both' }}
          >
            {/* Close button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowQuickView(false); }}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full border border-stone-200/80 hover:border-stone-400 bg-white/90 backdrop-blur-xs flex items-center justify-center text-stone-500 hover:text-stone-850 transition-all cursor-pointer shadow-xs"
              title="Đóng cửa sổ"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left side: Book Cover Image */}
            <div className="w-full md:w-1/2 relative aspect-[3.8/5] md:aspect-auto md:h-auto min-h-[380px] bg-stone-50 overflow-hidden flex items-center justify-center">
              {/* 3D Spine overlay on the book cover inside modal */}
              <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-black/20 via-black/5 to-transparent z-10"></div>
              <div className="absolute top-0 left-3 bottom-0 w-[1px] bg-white/10 z-10"></div>
              <img
                src={defaultImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right side: Book Info & Details */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-between text-left select-text bg-white">
              <div className="space-y-4">
                {/* Stock Count */}
                <div className="flex items-center gap-1.5 text-[9px] font-sans font-bold uppercase tracking-widest">
                  {availableQty > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-green-700 bg-green-50 border border-green-150/40 px-2 py-0.5 rounded-sm">Còn {availableQty} quyển</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-red-650 bg-red-50 border border-red-150/40 px-2 py-0.5 rounded-sm">Hết hàng</span>
                    </>
                  )}
                </div>

                {/* Category */}
                <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#c5a880] block">
                  {categoryName}
                </span>

                {/* Title */}
                <h3 className="font-serif text-xl md:text-2xl font-bold text-stone-900 leading-snug uppercase tracking-wide">
                  {book.title}
                </h3>

                {/* Author */}
                <span className="text-xs text-stone-500 font-sans block">
                  Tác giả: <span className="font-serif font-bold italic text-[#2C4A3B] capitalize">{book.author}</span>
                </span>

                {/* Price */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[9px] font-sans font-bold text-[#c5a880] uppercase tracking-widest">Giá độc quyền:</span>
                  <p className="text-xl font-serif font-bold text-[#2C4A3B] tracking-wide">
                    {priceFormatted} đ
                  </p>
                </div>

                {/* Short description */}
                <p className="text-stone-600 text-xs md:text-sm leading-relaxed line-clamp-3 pt-2 font-sans italic">
                  {book.description ||
                    `Tác phẩm "${book.title}" tuyển chọn kỹ lưỡng mang lại những giá trị tri thức sâu sắc cho độc giả. Trải nghiệm ngay phiên bản số hóa đặc quyền tại hệ thống Pigeon Bookstore.`
                  }
                </p>
              </div>

              {/* Buttons and actions */}
              <div className="mt-8 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(book.id, book.title); }}
                    disabled={book.available_qty <= 0}
                    className="flex-grow bg-stone-900 hover:bg-[#2C4A3B] text-white font-sans text-xs font-bold py-3.5 px-6 rounded-none transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg className="w-3.5 h-3.5 stroke-current" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Thêm vào giỏ hàng
                  </button>

                  <button
                    onClick={handleToggleWishlist}
                    className="w-12 h-12 border border-divider hover:border-stone-950 hover:bg-stone-50 transition-all flex items-center justify-center cursor-pointer bg-white"
                    title={isLiked ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
                  >
                    <Heart size={18} fill={isLiked ? "#2C4A3B" : "none"} stroke={isLiked ? "#2C4A3B" : "currentColor"} className="transition-transform duration-300 active:scale-125" />
                  </button>
                </div>

                <Link
                  to={`/books/${book.id}`}
                  onClick={() => setShowQuickView(false)}
                  className="block text-center text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#2C4A3B] hover:text-[#1e3529] hover:underline transition-all pt-2 cursor-pointer"
                >
                  Xem chi tiết & đánh giá →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}