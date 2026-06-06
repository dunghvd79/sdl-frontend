import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/image';
import { Heart, ShoppingCart } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
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
        // Thêm sách hiện tại vào danh sách
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
      // Invalidate để đồng bộ chuẩn xác với cơ sở dữ liệu trên server
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

  // Fetch dữ liệu chi tiết cuốn sách bằng React Query
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

  const createReviewMutation = useMutation({
    mutationFn: async (newReview) => {
      const response = await api.post(`/books/${id}/reviews`, newReview);
      return response.data;
    },
    onSuccess: () => {
      setComment('');
      setRating(5);
      refetchReviews();
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    }
  });

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!rating) {
      alert('Vui lòng chọn số sao đánh giá!');
      return;
    }
    if (!comment || comment.trim().length < 10) {
      alert('Nội dung nhận xét phải có ít nhất 10 ký tự!');
      return;
    }
    createReviewMutation.mutate({ rating, comment });
  };

  const renderStars = (ratingCount) => {
    return (
      <div className="flex gap-0.5 text-amber-500 text-sm">
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
    order.items.some(item => String(item.hashId || item.bookId) === String(id))
  ));

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
      // Dự phòng nếu trình duyệt chặn window.close()
      setTimeout(() => {
        navigate('/');
      }, 100);
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
      'bg-emerald-700',
      'bg-teal-700',
      'bg-blue-700',
      'bg-indigo-700',
      'bg-purple-700',
      'bg-stone-700'
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

  const defaultImage = book 
    ? (book.cover_url ? getImageUrl(book.cover_url) : `https://picsum.photos/seed/${book.id + 10}/400/600`) 
    : '';

  const [selectedImage, setSelectedImage] = useState('');

  React.useEffect(() => {
    if (book) {
      setSelectedImage(book.cover_url ? getImageUrl(book.cover_url) : `https://picsum.photos/seed/${book.id + 10}/400/600`);
    }
  }, [book]);

  const defaultCover = book?.cover_url
    ? getImageUrl(book.cover_url)
    : `https://picsum.photos/seed/${book?.id + 10}/400/600`;

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
      <div className="max-w-4xl mx-auto py-16 px-4 flex-grow w-full">
        {/* Loading skeleton */}
        <div className="animate-pulse flex flex-col md:flex-row gap-8">
          <div className="bg-gray-200 h-96 w-full md:w-1/3 rounded-lg"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg inline-block border border-red-200">
          <p className="text-lg font-semibold">❌ Không tìm thấy cuốn sách này hoặc có lỗi kết nối.</p>
          <button 
            onClick={handleBack} 
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Quay lại Cửa hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 flex-grow w-full">
      {/* Nút quay lại */}
      <button
        onClick={handleBack}
        className="mb-8 flex items-center gap-1.5 text-xs text-stone-700 hover:text-[#2C4A3B] uppercase tracking-[0.15em] font-sans font-extrabold transition-colors cursor-pointer"
      >
        ← QUAY LẠI DANH SÁCH
      </button>

      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 md:p-12 flex flex-col md:flex-row gap-10 lg:gap-16 relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)] min-h-[500px]">
        {/* SVG book outline */}
        <svg className="absolute -top-4 -right-4 text-stone-100 w-44 h-44 opacity-25 select-none pointer-events-none z-0" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>

        {/* Cột trái: Ảnh bìa & Thumbnails */}
        <div className="w-full md:w-[32%] flex flex-col items-center justify-start z-10">
          <div className="relative aspect-[3/4] w-full max-w-sm rounded-none overflow-hidden border border-stone-200/60 shadow-[0_12px_28px_rgba(0,0,0,0.06)] bg-stone-50">
            {/* 3D Book spine effect */}
            <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-r from-black/15 via-black/5 to-transparent z-10"></div>
            <div className="absolute top-0 left-2.5 bottom-0 w-[1px] bg-white/10 z-10"></div>
            <img
              src={selectedImage}
              alt={book.title}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>

          {/* Thumbnails Carousel */}
          <div className="flex items-center gap-2 mt-5 w-full justify-center max-w-sm relative">
            {thumbnails.map((thumb, idx) => {
              const isSelected = selectedImage === thumb;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(thumb)}
                  className={`w-12 h-16 rounded-md overflow-hidden border-2 bg-stone-50 transition-all cursor-pointer ${
                    isSelected ? 'border-[#2C4A3B] scale-105 shadow-sm' : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
            
            {/* Carousel Right arrow helper */}
            <button
              onClick={handleNextImage}
              className="w-6 h-6 rounded-full border border-stone-200 bg-white shadow-sm flex items-center justify-center text-stone-500 hover:text-stone-800 hover:border-stone-400 cursor-pointer hover:scale-105 active:scale-95 transition-all ml-1"
              title="Xem tiếp ảnh"
            >
              <span className="text-[10px] leading-none mt-px font-bold">›</span>
            </button>
          </div>
        </div>

        {/* Cột phải: Thông tin chi tiết */}
        <div className="flex-grow flex flex-col justify-between z-10 text-left">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2.5">
              <span className="border border-stone-400 text-stone-700 bg-white text-[8px] font-sans font-bold px-3 py-1 uppercase tracking-[0.15em] rounded-none">
                {book.category || 'Văn học'}
              </span>
              <span className="border border-[#c5a880]/30 text-[#c5a880] bg-[#faf8f5] text-[8px] font-sans font-bold px-3 py-1 uppercase tracking-[0.15em] rounded-none">
                Sách số hóa cao cấp
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-stone-900 leading-tight tracking-wide uppercase">
              {book.title}
            </h1>

            {/* Điểm số sao */}
            {reviewsData?.stats && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5 text-amber-400 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(reviewsData.stats.avg_rating) ? '★' : '☆'}</span>
                  ))}
                </div>
                <span className="text-[9px] font-sans text-stone-500 uppercase tracking-widest font-bold mt-0.5">
                  {Number(reviewsData.stats.avg_rating).toFixed(1)} / 5.0 ({reviewsData.stats.review_count} ĐÁNH GIÁ CỦA ĐỘC GIẢ)
                </span>
              </div>
            )}

            {/* Divider line exactly matching the mockup */}
            <hr className="border-stone-200/80 my-4" />

            <p className="text-[10px] text-stone-500 uppercase font-sans tracking-[0.15em] mb-4">
              TÁC GIẢ: <span className="font-serif font-bold italic text-stone-850 capitalize ml-1.5">{book.author}</span>
            </p>

            {/* Price Box */}
            <div className="bg-[#faf8f5] border border-stone-200/60 px-6 py-4 flex items-center justify-between max-w-2xl shadow-xs">
              <span className="text-[9px] font-sans font-bold text-[#c5a880] uppercase tracking-widest">GIÁ BÁN ĐẶC QUYỀN:</span>
              <p className="text-xl md:text-2xl font-serif font-bold text-stone-900 tracking-wide">
                {Number(book.price).toLocaleString('vi-VN')} đ
              </p>
            </div>

            {/* Giới thiệu tác phẩm */}
            <div className="space-y-3.5 max-w-3xl">
              <h3 className="font-serif text-xs font-bold text-stone-850 uppercase tracking-widest flex items-center gap-2">
                — Giới thiệu tác phẩm
              </h3>
              <div 
                className="text-stone-750 leading-relaxed text-xs md:text-sm text-justify font-sans font-normal"
              >
                {book.description || 
                  `Cuốn sách "${book.title}" là một trong những tác phẩm xuất sắc của tác giả ${book.author}. Tác phẩm mang đến cho độc giả góc nhìn sâu sắc và những thông điệp giá trị. Phù hợp cho những ai muốn nghiên cứu sâu, học tập hoặc đơn giản là tìm kiếm nguồn tri thức mới mẻ.`
                }
              </div>
            </div>
          </div>

          {/* Cụm nút hành động */}
          <div className="space-y-4 mt-8">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center max-w-3xl">
              <button
                onClick={() => addToCart(book.id, book.title)}
                className="flex-grow h-[52px] bg-stone-900 hover:bg-[#2C4A3B] active:bg-stone-950 text-white font-sans text-xs font-bold rounded-none transition-all duration-300 uppercase tracking-[0.2em] shadow-sm hover:shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart size={14} /> Thêm vào giỏ hàng
              </button>

              <button
                onClick={handleToggleWishlist}
                className="w-[52px] h-[52px] border border-stone-200 hover:border-stone-950 hover:bg-stone-50 transition-all flex items-center justify-center cursor-pointer bg-white shrink-0"
                title={isLiked ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
              >
                <Heart size={18} fill={isLiked ? "#2C4A3B" : "none"} stroke={isLiked ? "#2C4A3B" : "currentColor"} className="transition-transform duration-300 active:scale-125" />
              </button>

              {hasAccess ? (
                <button
                  onClick={handleChat}
                  className="flex-grow sm:flex-initial h-[52px] bg-[#faf8f5] hover:bg-[#2C4A3B] border border-[#2C4A3B]/30 hover:border-[#2C4A3B] text-[#2C4A3B] hover:text-white font-sans text-xs font-bold px-6 rounded-none transition-all duration-300 uppercase tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  🤖 Hỏi đáp AI (RAG)
                </button>
              ) : (
                <button
                  disabled
                  title="Tính năng hỏi đáp AI chỉ mở khóa sau khi bạn mua sách và nhận giao hàng thành công"
                  className="flex-grow sm:flex-initial h-[52px] bg-[#faf8f5] border border-[#c5a880]/30 text-[#c5a880] font-sans text-[10px] font-bold px-6 rounded-none uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  🤖 AI Chat (Chưa mua)
                </button>
              )}
            </div>

            {/* Blue Info Alert Box */}
            <div className="flex items-start gap-2.5 bg-[#f0f9ff] border border-[#bae6fd] p-3.5 max-w-3xl rounded-none shadow-xs">
              <svg className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-[10px] text-[#0369a1] font-sans leading-normal font-bold tracking-wide uppercase">
                TÍNH NĂNG HỎI ĐÁP THÔNG MINH (RAG) SẼ ĐƯỢC TỰ ĐỘNG KÍCH HOẠT SAU KHI BẠN MUA VÀ NHẬN SÁCH THÀNH CÔNG
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Khối đánh giá độc giả (Reviews Section) */}
      <div className="mt-16 border-t border-divider pt-12">
        <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase block mb-3">
          Phản hồi từ độc giả
        </span>
        <h2 className="font-serif text-3xl font-bold uppercase tracking-wider text-ink mb-10">
          Đánh giá & Nhận xét
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cột 1: Thống kê số sao */}
          <div className="bg-white border border-stone-200/80 p-8 rounded-2xl shadow-sm space-y-6">
            <div className="text-center">
              <span className="text-6xl font-serif font-black text-stone-900 leading-none block mb-2">
                {reviewsData?.stats ? Number(reviewsData.stats.avg_rating).toFixed(1) : '0.0'}
              </span>
              <div className="flex justify-center mb-1.5">
                {renderStars(reviewsData?.stats?.avg_rating || 0)}
              </div>
              <p className="text-[10px] uppercase tracking-widest font-sans font-bold text-stone-400">
                Có tất cả {reviewsData?.stats?.review_count || 0} đánh giá
              </p>
            </div>

            {/* Phân phối xếp hạng sao */}
            <div className="space-y-2.5 pt-6 border-t border-divider-lt">
              {(() => {
                const reviewsList = reviewsData?.reviews || [];
                const total = reviewsList.length;
                const dist = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars
                reviewsList.forEach(r => {
                  const star = Math.round(r.rating);
                  if (star >= 1 && star <= 5) {
                    dist[5 - star]++;
                  }
                });

                return [5, 4, 3, 2, 1].map((star, idx) => {
                  const count = dist[idx];
                  const percent = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs font-sans">
                      <span className="w-12 text-stone-500 font-bold whitespace-nowrap text-left">{star} sao</span>
                      <div className="flex-grow bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#2C4A3B] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="w-6 text-stone-400 font-medium text-right">{count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Cột 2 & 3: Nhận xét và Form gửi nhận xét */}
          <div className="lg:col-span-2 space-y-8">
            {/* Form gửi nhận xét (Chỉ cho user đã đăng nhập) */}
            {user ? (
              <form onSubmit={handleSubmitReview} className="border border-stone-200/80 p-8 bg-[#faf8f5]/60 rounded-2xl shadow-xs space-y-5">
                <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-ink">
                  Viết nhận xét của bạn
                </h3>
                
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-sans uppercase font-bold tracking-wider text-[#2C4A3B]">Đánh giá của bạn:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-all duration-200 hover:scale-125 focus:outline-none cursor-pointer bg-transparent border-none ${
                          star <= rating ? 'text-amber-500 transform scale-110' : 'text-stone-300 hover:text-amber-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-sans font-bold text-stone-500 ml-3 uppercase tracking-wider">
                      {rating === 5 && '🌟 Tuyệt vời'}
                      {rating === 4 && '✨ Rất tốt'}
                      {rating === 3 && '👍 Bình thường'}
                      {rating === 2 && '👎 Chưa hài lòng'}
                      {rating === 1 && '😢 Tệ'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="comment" className="text-xs font-sans uppercase font-bold tracking-wider text-[#2C4A3B]">Bình luận nhận xét:</label>
                  <textarea
                    id="comment"
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ cảm nghĩ chi tiết của bạn về nội dung cuốn sách này để giúp những độc giả khác nhé..."
                    className="border border-stone-300 rounded-none p-3.5 text-sm focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] outline-none transition-all w-full resize-none font-sans bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={createReviewMutation.isPending}
                  className="bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] disabled:opacity-50 text-white font-sans text-xs font-bold uppercase tracking-widest px-8 py-3.5 transition-colors cursor-pointer rounded-none animate-none"
                >
                  {createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi nhận xét ngay'}
                </button>
              </form>
            ) : (
              <div className="border border-dashed border-stone-300 p-8 bg-stone-50 text-center rounded-xl">
                <p className="text-xs uppercase tracking-widest font-sans font-bold text-stone-500">
                  Vui lòng <span className="text-[#2C4A3B] cursor-pointer hover:underline font-extrabold" onClick={() => navigate('/login')}>đăng nhập</span> để viết đánh giá cho cuốn sách này.
                </p>
              </div>
            )}

            {/* Danh sách nhận xét */}
            <div className="space-y-6 pt-4">
              <h3 className="font-serif text-lg font-bold uppercase tracking-wider text-ink border-b border-divider pb-3">
                Nhận xét chi tiết
              </h3>

              {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                <div className="divide-y divide-stone-100 border border-stone-200/80 bg-white rounded-2xl px-6 shadow-sm">
                  {reviewsData.reviews.map((rev) => {
                    const initials = getInitials(rev.user_name);
                    const avatarBg = getAvatarBgColor(rev.user_name);
                    return (
                      <div key={rev.id} className="py-6 flex gap-4 items-start">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-sans text-xs font-bold shrink-0 ${avatarBg}`}>
                          {initials}
                        </div>
                        <div className="flex-grow space-y-2 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-sans text-xs font-bold text-stone-900 uppercase tracking-wide truncate max-w-[200px]">
                                {rev.user_name}
                              </span>
                              {rev.is_verified_purchase && (
                                <span className="inline-flex items-center text-[8px] font-sans font-bold text-[#2C4A3B] bg-green-50 border border-green-200/60 px-1.5 py-0.5 uppercase tracking-widest rounded-none">
                                  ✓ Đã mua hàng
                                </span>
                              )}
                              <div className="flex text-amber-500 text-xs mt-0.5">
                                {renderStars(rev.rating)}
                              </div>
                            </div>
                            <span className="font-sans text-[10px] text-stone-400 uppercase tracking-widest whitespace-nowrap">
                              {formatReviewDate(rev.created_at)}
                            </span>
                          </div>
                          <p className="text-sm font-sans text-stone-600 leading-relaxed text-justify whitespace-pre-wrap break-words pr-2">
                            {rev.comment || 'Không có bình luận.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs italic font-sans text-ink-60 uppercase tracking-wider py-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-xl">
                  Chưa có nhận xét nào. Hãy là người đầu tiên viết đánh giá cho cuốn sách này!
                </p>
              )}
            </div>
          </div>
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
