import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { getImageUrl } from '../services/image';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Heart, ShoppingCart, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch wishlist
  const { data: wishlist, isLoading, isError } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: async () => {
      const response = await api.get('/wishlists');
      return response.data.data;
    },
    enabled: !!user,
  });

  // Toggle wishlist item (Optimistic Update)
  const toggleWishlistMutation = useMutation({
    mutationFn: async (bookId) => {
      await api.post('/wishlists/toggle', { bookId });
    },
    onMutate: async (bookId) => {
      // Hủy bỏ các refetch đang chạy để tránh ghi đè
      await queryClient.cancelQueries({ queryKey: ['myWishlist'] });

      // Lưu lại trạng thái cache hiện tại
      const previousWishlist = queryClient.getQueryData(['myWishlist']) || [];

      // Dự báo trạng thái cache mới (gỡ bỏ sách bị unlike ngay lập tức)
      const newWishlist = previousWishlist.filter(item => String(item.id) !== String(bookId));

      // Cập nhật bộ đệm cache tức thì
      queryClient.setQueryData(['myWishlist'], newWishlist);

      // Trả về dữ liệu cũ đề phòng rollback
      return { previousWishlist };
    },
    onError: (err, bookId, context) => {
      // Rollback nếu xảy ra lỗi mạng
      if (context?.previousWishlist) {
        queryClient.setQueryData(['myWishlist'], context.previousWishlist);
      }
    },
    onSettled: () => {
      // Đồng bộ lại với DB
      queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
    }
  });

  const handleUnlike = (bookId) => {
    toggleWishlistMutation.mutate(bookId);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-6 flex-grow w-full flex flex-col justify-center items-center bg-[#faf8f5]">
        <div className="animate-pulse space-y-6 w-full max-w-4xl">
          <div className="h-10 bg-stone-200 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-stone-200 rounded w-1/2 mx-auto"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-divider p-4 space-y-4">
                <div className="aspect-[4/5] bg-stone-200 w-full"></div>
                <div className="h-6 bg-stone-200 w-3/4"></div>
                <div className="h-4 bg-stone-200 w-1/2"></div>
                <div className="h-10 bg-stone-200 w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-6 text-center flex-grow w-full bg-[#faf8f5] flex flex-col justify-center items-center">
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 max-w-lg">
          <h2 className="text-xl font-serif font-bold uppercase tracking-wider mb-3">Lỗi tải dữ liệu</h2>
          <p className="text-sm font-sans mb-4">Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#2C4A3B] text-white px-6 py-2 uppercase font-sans font-bold tracking-widest text-xs hover:bg-[#1e3529]"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const items = wishlist || [];

  return (
    <div className="min-h-screen bg-[#faf8f5] flex-grow py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigate('/')}
          className="group mb-8 flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 uppercase tracking-widest font-sans font-bold transition-colors border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại Cửa hàng
        </button>

        {/* Header section */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="text-[#2C4A3B] text-[10px] font-sans font-bold tracking-[0.3em] uppercase block">
            Danh mục cá nhân
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 uppercase tracking-wide">
            Sách yêu thích của tôi
          </h1>
          <div className="h-0.5 w-16 bg-[#2C4A3B] mx-auto mt-4"></div>
          <p className="text-stone-500 font-sans italic text-sm">
            Nơi lưu giữ những tác phẩm văn học, nghiên cứu bạn yêu thích và quan tâm để tiện theo dõi, tham khảo hoặc mua sắm sau này.
          </p>
        </div>

        {/* Wishlist Grid */}
        {items.length === 0 ? (
          <div className="border border-stone-200 bg-white p-16 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full border border-stone-100 flex items-center justify-center bg-stone-50 text-stone-400">
              <Heart size={28} className="animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-stone-800">
                Danh sách trống
              </h3>
              <p className="text-stone-500 font-sans text-xs max-w-sm mx-auto leading-relaxed">
                Bạn chưa thêm cuốn sách nào vào danh sách yêu thích của mình. Khám phá kho sách khổng lồ của Pigeon Bookstore ngay bây giờ.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#2C4A3B] hover:bg-[#1e3529] text-white px-8 py-3.5 uppercase font-sans font-bold tracking-widest text-xs transition-colors shadow-sm"
            >
              <BookOpen size={14} />
              Khám phá sách ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {items.map((book) => {
              const defaultImage = book.cover_url 
                ? getImageUrl(book.cover_url) 
                : `https://picsum.photos/seed/${book.id + 10}/800/1000`;
              
              const priceFormatted = Number(book.price).toLocaleString('vi-VN');

              return (
                <div key={book.id} className="bg-white border border-stone-200 p-4 flex flex-col justify-between group transition-all duration-300 hover:shadow-md relative">
                  {/* Heart button to unlike */}
                  <button
                    onClick={() => handleUnlike(book.id)}
                    className="absolute top-6 right-6 bg-white/95 p-2 rounded-full text-[#2C4A3B] hover:bg-stone-50 shadow-sm border border-stone-100 transition-colors z-20 cursor-pointer flex items-center justify-center"
                    title="Xóa khỏi danh sách yêu thích"
                  >
                    <Heart size={16} fill="#2C4A3B" />
                  </button>

                  <Link to={`/books/${book.id}`} className="block">
                    {/* Cover Wrapper */}
                    <div className="w-full aspect-[4/5] overflow-hidden bg-stone-100 mb-5 relative border border-stone-100">
                      <img
                        src={defaultImage}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      />
                      {book.rag_indexed_at && (
                        <span className="absolute bottom-3 left-3 bg-[#2C4A3B] text-white text-[9px] font-sans font-bold px-2 py-0.5 tracking-wider uppercase flex items-center gap-1 shadow-sm">
                          <Sparkles size={8} />
                          Sẵn sàng AI
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <h3 className="font-serif text-xl text-stone-950 line-clamp-2 uppercase mb-2 group-hover:text-[#2C4A3B] transition-colors leading-tight min-h-[2.5rem]">
                      {book.title}
                    </h3>
                  </Link>

                  <div className="mt-2 border-t border-stone-100 pt-3 flex flex-col gap-3">
                    <div className="flex justify-between items-start text-xs font-sans text-stone-500 uppercase tracking-wider">
                      <span className="truncate max-w-[60%]">{book.author}</span>
                      <span className="font-bold text-stone-900">{priceFormatted} đ</span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/books/${book.id}`}
                        className="flex-1 py-2.5 border border-stone-200 hover:border-stone-900 text-stone-700 hover:text-stone-900 text-center uppercase tracking-wider font-sans text-[10px] font-bold transition-all"
                      >
                        Chi tiết
                      </Link>
                      
                      <button
                        onClick={() => addToCart(book.id, book.title)}
                        className="flex-1 bg-[#2C4A3B] hover:bg-[#1e3529] text-white py-2.5 uppercase tracking-wider font-sans text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5 border-0"
                      >
                        <ShoppingCart size={12} />
                        Mua ngay
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
