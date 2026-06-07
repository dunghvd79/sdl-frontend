import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../services/image';
import { 
  Heart, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Award, 
  MessageSquare,
  FileText,
  Bookmark,
  Info
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch wishlist to see if this book is liked
  const { data: wishlist } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => api.get('/wishlists').then(r => r.data.data),
    enabled: !!user
  });

  const isLiked = Array.isArray(wishlist) && wishlist.some(item => String(item.hashId || item.id) === String(id));

  // Toggle wishlist item (Optimistic Update)
  const toggleWishlistMutation = useMutation({
    mutationFn: () => api.post('/wishlists/toggle', { bookId: id }),
    onMutate: async () => {
      // Hủy bỏ các refetch đang chạy của wishlist để tránh ghi đè
      await queryClient.cancelQueries({ queryKey: ['myWishlist'] });

      // Lưu lại trạng thái cache hiện tại
      const previousWishlist = queryClient.getQueryData(['myWishlist']) || [];

      // Dự đoán trạng thái cache mới sau khi toggle
      let newWishlist = [...previousWishlist];
      const isAlreadyLiked = newWishlist.some(item => String(item.hashId || item.id) === String(id));
      if (isAlreadyLiked) {
        newWishlist = newWishlist.filter(item => String(item.hashId || item.id) !== String(id));
      } else {
        if (book) {
          newWishlist.push(book);
        } else {
          newWishlist.push({ id, hashId: id });
        }
      }

      // Cập nhật bộ đệm cache lập tức để UI đổi màu tim tức thì
      queryClient.setQueryData(['myWishlist'], newWishlist);

      // Trả về dữ liệu cũ để rollback nếu có lỗi
      return { previousWishlist };
    },
    onError: (err, variables, context) => {
      // Rollback về trạng thái cũ nếu xảy ra lỗi mạng
      if (context?.previousWishlist) {
        queryClient.setQueryData(['myWishlist'], context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
    }
  });

  const [showLoginConfirm, setShowLoginConfirm] = useState(false);

  const handleToggleWishlist = () => {
    if (!user) {
      setShowLoginConfirm(true);
      return;
    }
    toggleWishlistMutation.mutate();
  };

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPage, setReviewPage] = useState(1);

  // Fetch dữ liệu chi tiết cuốn sách
  const { data: book, isLoading, isError } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const response = await api.get(`/books/${id}`);
      return response.data.data;
    }
  });

  // Fetch reviews và thống kê đánh giá
  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ['bookReviews', id],
    queryFn: async () => {
      const response = await api.get(`/books/${id}/reviews`);
      return response.data.data;
    }
  });

  const reviewsList = reviewsData?.reviews || [];
  const totalReviews = reviewsList.length;
  const REVIEWS_PER_PAGE = 5;
  const totalReviewPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);
  const paginatedReviews = reviewsList.slice(
    (reviewPage - 1) * REVIEWS_PER_PAGE,
    reviewPage * REVIEWS_PER_PAGE
  );

  const createReviewMutation = useMutation({
    mutationFn: async (newReview) => {
      const response = await api.post(`/books/${id}/reviews`, newReview);
      return response.data;
    },
    onSuccess: () => {
      setComment('');
      setRating(5);
      refetchReviews();
      setReviewPage(1);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    }
  });

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!rating) {
      toast.warning('Vui lòng chọn số sao đánh giá!');
      return;
    }
    if (!comment || comment.trim().length < 10) {
      toast.warning('Nội dung nhận xét phải có ít nhất 10 ký tự!');
      return;
    }
    createReviewMutation.mutate({ rating, comment });
  };

  const renderStars = (ratingCount, sizeClass = 'text-xs') => {
    return (
      <div className={`flex gap-0.5 text-amber-500 ${sizeClass}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i}>{i < Math.round(ratingCount) ? '★' : '☆'}</span>
        ))}
      </div>
    );
  };

  // Fetch danh sách đơn hàng để kiểm tra quyền sở hữu
  const { data: orders } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      try {
        const response = await api.get('/orders');
        return response.data.data;
      } catch (err) {
        return [];
      }
    },
    enabled: !!user
  });

  const isEmployee = user && (user.role === 'ADMIN' || user.role === 'CURATOR');
  const hasAccess = isEmployee || (Array.isArray(orders) && orders.some(order =>
    order.status === 'DELIVERED' &&
    order.items.some(item => String(item.bookId) === String(id))
  ));

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleChat = () => {
    navigate(`/books/${id}/chat`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split('@')[0].split(/[._-]/);
    const initials = parts.map(p => p[0]).join('');
    return initials.substring(0, 2).toUpperCase();
  };

  const getAvatarBgColor = (name) => {
    if (!name) return 'bg-[#2C4A3B]';
    const colors = [
      'bg-emerald-700/80',
      'bg-teal-700/80',
      'bg-indigo-700/80',
      'bg-stone-700/80'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const formatReviewDate = (dateStr) => {
    if (!dateStr) return 'Đã nhận xét';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Đã nhận xét';
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1 && now.getDate() === date.getDate()) {
      return 'Hôm nay';
    } else if (diffDays <= 2 && now.getDate() - date.getDate() === 1) {
      return 'Hôm qua';
    }
    return date.toLocaleDateString('vi-VN');
  };

  const [selectedImage, setSelectedImage] = useState('');

  React.useEffect(() => {
    if (book) {
      setSelectedImage(book.cover_url ? getImageUrl(book.cover_url) : `https://picsum.photos/seed/${book.id}/400/600`);
    }
  }, [book]);

  const defaultCover = book?.cover_url
    ? getImageUrl(book.cover_url)
    : `https://picsum.photos/seed/${book?.id}/400/600`;

  const thumbnails = book ? [
    defaultCover,
    ...(book.images || []).map(img => getImageUrl(img.image_url))
  ] : [];

  const handleNextImage = () => {
    if (thumbnails.length === 0) return;
    const currentIndex = thumbnails.indexOf(selectedImage);
    const nextIndex = (currentIndex + 1) % thumbnails.length;
    setSelectedImage(thumbnails[nextIndex]);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 flex-grow w-full bg-[#fdfcfa]">
        <div className="animate-pulse space-y-8">
          <div className="h-6 w-32 bg-[#f0ece7]"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="bg-[#f0ece7] h-96 w-full md:w-1/3 border border-divider-lt"></div>
            <div className="flex-1 space-y-6">
              <div className="h-10 bg-[#f0ece7] w-3/4"></div>
              <div className="h-4 bg-[#f0ece7] w-1/4"></div>
              <div className="h-24 bg-[#f0ece7]"></div>
              <div className="h-12 bg-[#f0ece7] w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4 text-center flex-grow w-full bg-[#fdfcfa]">
        <div className="bg-white border border-divider p-8 inline-block max-w-md text-center">
          <p className="text-sm font-serif font-bold text-ink mb-6">❌ Không tìm thấy cuốn sách này hoặc có lỗi kết nối.</p>
          <button 
            onClick={handleBack} 
            className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest rounded-none transition-colors cursor-pointer"
          >
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full bg-[#fdfcfa]">
      
      {/* Nút quay lại */}
      <button
        onClick={handleBack}
        className="mb-8 flex items-center gap-1.5 text-[10px] text-stone-500 hover:text-[#2C4A3B] uppercase tracking-[0.2em] font-sans font-bold transition-colors cursor-pointer bg-transparent border-0"
      >
        <ChevronLeft size={14} /> Quay lại danh sách sách
      </button>

      {/* Main Details Card */}
      <div className="bg-white border border-divider rounded-none p-6 md:p-10 lg:p-12 flex flex-col md:flex-row gap-8 lg:gap-12 relative overflow-hidden">
        
        {/* Cột trái: Ảnh bìa & Thumbnails */}
        <div className="w-full md:w-[32%] flex flex-col items-center justify-start flex-shrink-0">
          
          {/* Cover Frame with 3D spine and shadow */}
          <div className="relative aspect-[3/4] w-full max-w-xs rounded-none border border-stone-200/80 shadow-[0_8px_24px_rgba(0,0,0,0.06)] bg-[#faf8f5] overflow-hidden select-none">
            <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-r from-black/15 via-black/5 to-transparent z-10"></div>
            <img
              src={selectedImage}
              alt={book.title}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          {/* Thumbnails Carousel */}
          {thumbnails.length > 1 && (
            <div className="flex items-center gap-2 mt-4 w-full justify-center max-w-xs relative">
              {thumbnails.map((thumb, idx) => {
                const isSelected = selectedImage === thumb;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(thumb)}
                    className={`w-10 h-14 rounded-none overflow-hidden border-2 bg-stone-50 transition-all cursor-pointer ${
                      isSelected ? 'border-[#2C4A3B] scale-105 shadow-sm' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
              
              <button
                onClick={handleNextImage}
                className="w-6 h-6 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center text-stone-500 hover:text-stone-800 hover:border-stone-400 cursor-pointer hover:scale-105 active:scale-95 transition-all ml-1"
                title="Xem tiếp ảnh"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Cột phải: Thông tin chi tiết */}
        <div className="flex-grow flex flex-col justify-between text-left space-y-6">
          <div className="space-y-4">
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="border border-stone-300 text-stone-500 bg-white text-[8px] font-sans font-bold px-2.5 py-0.5 uppercase tracking-widest rounded-none">
                {book.category || 'Văn học'}
              </span>
              <span className="border border-[#2C4A3B]/30 text-[#2C4A3B] bg-[#2C4A3B]/5 text-[8px] font-sans font-bold px-2.5 py-0.5 uppercase tracking-widest rounded-none flex items-center gap-1">
                <Sparkles size={8} /> Sách số hóa RAG AI
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink leading-tight tracking-wide uppercase">
              {book.title}
            </h1>

            {/* Stars rating summary */}
            {reviewsData?.stats && (
              <div className="flex items-center gap-2">
                {renderStars(reviewsData.stats.avg_rating, 'text-sm')}
                <span className="text-[9px] font-sans text-stone-500 uppercase tracking-widest font-bold mt-0.5">
                  {Number(reviewsData.stats.avg_rating).toFixed(1)} / 5.0 ({reviewsData.stats.review_count} Nhận xét từ độc giả)
                </span>
              </div>
            )}

            <hr className="border-divider my-2" />

            {/* Author */}
            <p className="text-[10px] text-stone-500 uppercase font-sans tracking-widest">
              TÁC GIẢ: <span className="font-serif font-bold italic text-ink ml-1 capitalize">{book.author}</span>
            </p>

            {/* Price Box */}
            <div className="bg-[#faf8f5] border border-divider px-5 py-3.5 flex items-center justify-between max-w-xl shadow-none">
              <span className="text-[9px] font-sans font-bold text-stone-400 uppercase tracking-widest">Đơn giá sở hữu:</span>
              <p className="text-xl font-serif font-bold text-[#2C4A3B] font-mono">
                {Number(book.price).toLocaleString('vi-VN')} đ
              </p>
            </div>

            {/* Giới thiệu tác phẩm */}
            <div className="space-y-2 max-w-3xl">
              <h3 className="font-serif text-[11px] font-bold text-ink uppercase tracking-widest flex items-center gap-1.5 select-none">
                — Tóm tắt tác phẩm
              </h3>
              <p className="text-stone-600 leading-relaxed text-xs md:text-sm text-justify font-sans">
                {book.description || 
                  `Tác phẩm "${book.title}" là một trong những cuốn sách chọn lọc tiêu biểu của tác giả ${book.author}. Với nội dung giá trị và cốt truyện lôi cuốn, tác phẩm mở rộng tầm tri thức và mang đến những góc nhìn nhân sinh đầy chiều sâu cho độc giả.`
                }
              </p>
            </div>

            {/* Technical Specifications Grid (New & Professional) */}
            <div className="pt-2 max-w-3xl">
              <h3 className="font-serif text-[11px] font-bold text-ink uppercase tracking-widest flex items-center gap-1.5 select-none mb-3">
                — Thông số kỹ thuật
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-divider p-4 bg-[#faf8f5]/40 text-xs font-sans">
                <div className="flex justify-between border-b border-stone-200/50 pb-1.5">
                  <span className="text-stone-400 uppercase tracking-wider text-[9px] font-bold">Mã ISBN</span>
                  <span className="font-mono text-ink font-semibold">{book.isbn || '978-604-x-xxxx'}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/50 pb-1.5">
                  <span className="text-stone-400 uppercase tracking-wider text-[9px] font-bold">Ngôn ngữ</span>
                  <span className="text-ink font-semibold">Tiếng Việt</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/50 pb-1.5">
                  <span className="text-stone-400 uppercase tracking-wider text-[9px] font-bold">Định dạng</span>
                  <span className="text-ink font-semibold">Bản điện tử (PDF)</span>
                </div>
                <div className="flex justify-between border-b border-stone-200/50 pb-1.5">
                  <span className="text-stone-400 uppercase tracking-wider text-[9px] font-bold">Hỗ trợ AI</span>
                  <span className="text-green-700 font-bold flex items-center gap-0.5 uppercase tracking-wide text-[10px]">
                    {book.rag_indexed_at ? (
                      <><Sparkles size={10} /> Trợ lý RAG 24/7</>
                    ) : 'Không'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center max-w-3xl">
              <button
                onClick={() => addToCart(book.id, book.title)}
                className="flex-grow h-[48px] bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-sans text-xs font-bold rounded-none transition-all duration-300 uppercase tracking-[0.2em] shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart size={13} /> Thêm vào giỏ hàng
              </button>

              <button
                onClick={handleToggleWishlist}
                className="w-[48px] h-[48px] border border-stone-200 hover:border-stone-900 hover:bg-stone-50 transition-all flex items-center justify-center cursor-pointer bg-white shrink-0"
                title={isLiked ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
              >
                <Heart size={16} fill={isLiked ? "#2C4A3B" : "none"} stroke={isLiked ? "#2C4A3B" : "currentColor"} className="transition-transform duration-300 active:scale-125" />
              </button>

              {hasAccess ? (
                <button
                  onClick={handleChat}
                  className="flex-grow sm:flex-initial h-[48px] bg-white hover:bg-stone-50 border border-[#2C4A3B] text-[#2C4A3B] font-sans text-xs font-bold px-6 rounded-none transition-all duration-300 uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <MessageSquare size={13} /> Hỏi đáp AI (RAG)
                </button>
              ) : (
                <button
                  disabled
                  title="Tính năng hỏi đáp AI chỉ mở khóa sau khi bạn mua sách và nhận giao hàng thành công"
                  className="flex-grow sm:flex-initial h-[48px] bg-stone-100 border border-stone-200 text-stone-400 font-sans text-[9px] font-bold px-6 rounded-none uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Lock size={12} /> AI Chat (Chưa mua)
                </button>
              )}
            </div>

            {/* Blue Info Alert Box */}
            <div className="flex items-start gap-2.5 bg-blue-50/50 border border-blue-200 p-3.5 max-w-3xl rounded-none text-xs">
              <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
              <p className="text-[9px] text-blue-700 font-sans leading-relaxed font-bold tracking-wide uppercase">
                GỢI Ý: Sở hữu tác phẩm số giúp bạn kích hoạt trợ lý AI của sách để tóm tắt, giải nghĩa và hỏi đáp chương chi tiết.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Nhận xét độc giả (Reviews Section) */}
      <div className="mt-16 border-t border-divider pt-12">
        <span className="text-[9px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase block mb-2">
          Phản hồi từ độc giả
        </span>
        <h2 className="font-serif text-3xl font-bold uppercase tracking-wider text-ink mb-10">
          Đánh giá & Nhận xét
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Cột 1: Thống kê số sao */}
          <div className="bg-white border border-divider p-8 rounded-none space-y-6">
            <div className="text-center">
              <span className="text-6xl font-serif font-black text-ink leading-none block mb-2">
                {reviewsData?.stats ? Number(reviewsData.stats.avg_rating).toFixed(1) : '0.0'}
              </span>
              <div className="flex justify-center mb-1.5">
                {renderStars(reviewsData?.stats?.avg_rating || 0, 'text-sm')}
              </div>
              <p className="text-[9px] uppercase tracking-widest font-sans font-bold text-stone-400">
                Có tổng cộng {reviewsData?.stats?.review_count || 0} nhận xét
              </p>
            </div>

            {/* Phân phối xếp hạng sao */}
            <div className="space-y-2.5 pt-6 border-t border-divider-lt">
              {(() => {
                const dist = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
                reviewsList.forEach(r => {
                  const star = Math.round(r.rating);
                  if (star >= 1 && star <= 5) {
                    dist[5 - star]++;
                  }
                });

                return [5, 4, 3, 2, 1].map((star, idx) => {
                  const count = dist[idx];
                  const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs font-sans">
                      <span className="w-12 text-stone-500 font-bold whitespace-nowrap text-left">{star} sao</span>
                      <div className="flex-grow bg-stone-100 h-1.5 rounded-none overflow-hidden">
                        <div 
                          className="bg-[#2C4A3B] h-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="w-6 text-stone-400 font-bold text-right">{count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Cột 2 & 3: Form gửi nhận xét */}
          <div className="lg:col-span-2">
            {user ? (
              hasAccess ? (
                <form onSubmit={handleSubmitReview} className="border border-divider p-8 bg-[#faf8f5]/60 rounded-none space-y-5">
                  <h3 className="font-serif text-base font-bold uppercase tracking-wider text-ink">
                    Viết nhận xét của bạn
                  </h3>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-sans uppercase font-bold tracking-wider text-[#2C4A3B]">Đánh giá số sao:</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl transition-transform duration-150 hover:scale-125 focus:outline-none cursor-pointer bg-transparent border-none ${
                            star <= rating ? 'text-amber-500' : 'text-stone-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-[10px] font-sans font-bold text-stone-400 ml-3 uppercase tracking-wider">
                        {rating === 5 && '🌟 Tuyệt vời'}
                        {rating === 4 && '✨ Rất tốt'}
                        {rating === 3 && '👍 Bình thường'}
                        {rating === 2 && '👎 Chưa tốt'}
                        {rating === 1 && '😢 Kém'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="comment" className="text-[10px] font-sans uppercase font-bold tracking-wider text-[#2C4A3B]">Bình luận chi tiết:</label>
                    <textarea
                      id="comment"
                      rows="3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ nhận xét thực tế về sách (độ dài ít nhất 10 ký tự)..."
                      className="border border-stone-200 rounded-none p-3.5 text-xs focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] outline-none transition-all w-full resize-none font-sans bg-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createReviewMutation.isPending}
                    className="bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] disabled:opacity-50 text-white font-sans text-xs font-bold uppercase tracking-widest px-6 py-3 transition-colors cursor-pointer rounded-none"
                  >
                    {createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi nhận xét của tôi'}
                  </button>
                </form>
              ) : (
                <div className="border border-dashed border-stone-300 p-8 bg-stone-50/50 text-center rounded-none text-xs">
                  <p className="uppercase tracking-widest font-sans font-bold text-stone-400">
                    Bạn cần mua và nhận giao hàng thành công cuốn sách này để có thể tham gia viết nhận xét.
                  </p>
                </div>
              )
            ) : (
              <div className="border border-dashed border-stone-300 p-8 bg-stone-50/50 text-center rounded-none text-xs">
                <p className="uppercase tracking-widest font-sans font-bold text-stone-400">
                  Vui lòng <span className="text-[#2C4A3B] cursor-pointer hover:underline font-extrabold" onClick={() => navigate('/login')}>đăng nhập</span> để bắt đầu viết nhận xét.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách nhận xét */}
        <div className="space-y-6 pt-10 mt-10 border-t border-divider">
          <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-ink">
            Ý kiến phản hồi cụ thể
          </h3>

          {paginatedReviews.length > 0 ? (
            <div className="divide-y divide-stone-100 border border-divider bg-white rounded-none px-6 shadow-none">
              {paginatedReviews.map((rev) => {
                const initials = getInitials(rev.user_name);
                const avatarBg = getAvatarBgColor(rev.user_name);
                return (
                  <div key={rev.id} className="py-6 flex gap-4 items-start">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-sans text-[11px] font-bold shrink-0 ${avatarBg}`}>
                      {initials}
                    </div>
                    <div className="flex-grow space-y-1.5 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-sans text-xs font-bold text-stone-800 uppercase tracking-wide truncate max-w-[200px]">
                            {rev.user_name}
                          </span>
                          {rev.is_verified_purchase && (
                            <span className="inline-flex items-center text-[7px] font-sans font-bold text-[#2C4A3B] bg-green-50 border border-green-200 px-1.5 py-0.5 uppercase tracking-widest rounded-none">
                              ✓ Đã mua
                            </span>
                          )}
                          <div className="flex text-amber-500 text-[10px] mt-0.5">
                            {renderStars(rev.rating)}
                          </div>
                        </div>
                        <span className="font-sans text-[9px] text-stone-400 uppercase tracking-widest">
                          {formatReviewDate(rev.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-sans text-stone-600 leading-relaxed text-justify whitespace-pre-wrap break-words pr-2">
                        {rev.comment || 'Không có nội dung bình luận.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] italic font-sans text-stone-400 uppercase tracking-wider py-8 text-center bg-stone-50/50 border border-dashed border-stone-200 rounded-none">
              Chưa có nhận xét nào cho cuốn sách này. Hãy là người đầu tiên đóng góp ý kiến!
            </p>
          )}

          {/* Pagination Controls for Reviews */}
          {totalReviewPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pt-4">
              <button
                type="button"
                onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                disabled={reviewPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#2C4A3B]/5 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer bg-white"
                aria-label="Trang trước"
              >
                <ChevronLeft size={12} />
              </button>

              <span className="text-[10px] font-sans font-bold text-stone-500 uppercase tracking-widest">
                Trang {reviewPage} / {totalReviewPages}
              </span>

              <button
                type="button"
                onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                disabled={reviewPage === totalReviewPages}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#2C4A3B]/5 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer bg-white"
                aria-label="Trang sau"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLoginConfirm}
        title="Yêu cầu đăng nhập"
        message="Vui lòng đăng nhập để lưu cuốn sách này vào danh sách yêu thích cá nhân của bạn."
        confirmText="Đăng nhập ngay"
        cancelText="Quay lại"
        variant="primary"
        onConfirm={() => navigate('/login', { state: { from: `/books/${id}` } })}
        onCancel={() => setShowLoginConfirm(false)}
      />
    </div>
  );
}
