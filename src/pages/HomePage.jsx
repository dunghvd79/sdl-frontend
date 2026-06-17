import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import BookCard from '../components/BookCard';
import { Search, ArrowRight, Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../services/image';


export default function HomePage() {
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const setSearchTerm = (val) => {
    setSearchParams(prev => {
      if (val) {
        prev.set('search', val);
      } else {
        prev.delete('search');
      }
      return prev;
    }, { replace: true });
  };

  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Sync local search when URL param changes
  React.useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // Debounce sync local search input back to URL params
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchTerm(localSearch);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [page, setPage] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to section based on navigation state and focus search if requested
  React.useEffect(() => {
    if (location.state) {
      const { scrollTo, focusSearch } = location.state;
      if (scrollTo || focusSearch) {
        const targetId = scrollTo || (focusSearch ? 'explore' : null);
        const element = targetId ? document.getElementById(targetId) : null;

        const timer = setTimeout(() => {
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
          if (focusSearch) {
            const searchInput = document.getElementById('homepage-search-input');
            if (searchInput) {
              searchInput.focus();
            }
          }
          // Clear state safely in React Router without breaking history state
          navigate(location.pathname, { replace: true });
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [location, navigate]);

  // Lấy danh sách danh mục
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    }
  });

  // Set category filter based on navigation state
  React.useEffect(() => {
    if (location.state && location.state.filterCategory && categories) {
      const matchedCat = categories.find(
        c => c.name && c.name.toLowerCase().includes(location.state.filterCategory.toLowerCase())
      );
      if (matchedCat) {
        setSelectedCategory(matchedCat.id);
      }
    }
  }, [location, categories]);

  // Tự động quay về trang 1 khi thay đổi bất kỳ bộ lọc nào
  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, sortBy, maxPrice]);

  // Cuộn mượt lên đầu danh sách sách (explore) khi đổi trang
  const isMounted = React.useRef(false);
  React.useEffect(() => {
    if (isMounted.current) {
      const element = document.getElementById('explore');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      isMounted.current = true;
    }
  }, [page]);

  // Lấy danh sách sách dựa vào filters (phân trang 8 quyển/trang)
  const { data: books, isLoading, isFetching, isError } = useQuery({
    queryKey: ['books', searchTerm, selectedCategory, sortBy, maxPrice, page],
    queryFn: async () => {
      const response = await api.get('/books', {
        params: {
          search: searchTerm,
          categoryId: selectedCategory,
          sortBy: sortBy,
          maxPrice: maxPrice,
          page: page,
          limit: 8
        }
      });
      return response.data.data;
    },
    placeholderData: (prev) => prev
  });

  // Tự động quay về trang 1 nếu trang hiện tại bị trống (ví dụ: sau khi xóa sách ở trang 2)
  React.useEffect(() => {
    if (!isLoading && books && books.length === 0 && page > 1) {
      setPage(1);
    }
  }, [books, page, isLoading]);

  // Lấy danh sách sách nổi bật (Editor's Picks)
  const { data: featuredBooks } = useQuery({
    queryKey: ['featuredBooks'],
    queryFn: async () => {
      const response = await api.get('/books', {
        params: { isFeatured: true, limit: 4 }
      });
      return response.data.data;
    }
  });

  // Lấy danh sách sách gợi ý khi tìm kiếm/lọc không ra kết quả
  const { data: recommendedBooks } = useQuery({
    queryKey: ['recommendedBooks'],
    queryFn: async () => {
      const response = await api.get('/books', {
        params: { limit: 4, sortBy: 'newest' }
      });
      return response.data.data;
    },
    enabled: !isLoading && !isError && books?.length === 0 && page === 1
  });

  // Lấy 3 bài viết mới nhất cho phần Bài viết nổi bật
  const { data: articlesResponse } = useQuery({
    queryKey: ['featuredArticles'],
    queryFn: async () => {
      const response = await api.get('/articles', {
        params: { limit: 3 }
      });
      return response.data;
    }
  });
  const articles = articlesResponse?.data || [];


  // Generate pages dynamic list for rendering
  const renderPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, page - 1);
    const endPage = books?.length < 8 ? page : page + 1;

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (!pages.includes(1)) {
      pages.unshift(1);
    }

    return (
      <div className="flex items-center gap-1.5">
        {pages.map((p, index) => {
          const showEllipsis = index === 1 && p > 2;
          return (
            <React.Fragment key={p}>
              {showEllipsis && (
                <span className="w-8 h-8 flex items-center justify-center text-stone-400 font-sans text-xs">
                  •••
                </span>
              )}
              <button
                onClick={() => setPage(p)}
                disabled={isFetching}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold tracking-wide transition-all duration-300 ${page === p
                    ? 'bg-[#2C4A3B] text-white shadow-sm shadow-[#2C4A3B]/25 scale-105 pointer-events-none'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#2C4A3B]/5 cursor-pointer'
                  }`}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 flex-grow w-full">
      {/* Editorial Hero Intro Section */}
      <div className="border-b border-divider pb-16 pt-6 md:pb-20 mb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typography & Content */}
          <div className="lg:col-span-7 flex flex-col text-left">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[1px] bg-[#2C4A3B]"></span>
              <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase">
                Kho lưu trữ tinh hoa
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-ink leading-[1.15] mb-6 tracking-wide uppercase">
              Tìm lại mình <br />
              <span className="italic font-normal text-[#2C4A3B] lowercase block mt-2">giữa thế giới ồn ào</span>
            </h1>

            <p className="text-xs md:text-sm text-stone-600 font-sans tracking-wider leading-relaxed mb-6 italic max-w-xl">
              “Tuyển chọn kỹ lưỡng — từng cuốn sách là một lời mời gọi đến những chân trời mới.”
            </p>

            <div className="text-[9px] font-sans font-bold text-stone-500 tracking-[0.2em] mb-8 uppercase flex flex-wrap gap-x-3 gap-y-1">
              <span>Văn học</span>
              <span className="text-stone-300">•</span>
              <span>Kiến thức</span>
              <span className="text-stone-300">•</span>
              <span>Thiếu nhi</span>
              <span className="text-stone-300">•</span>
              <span>Triết học</span>
              <span className="text-stone-300">•</span>
              <span>Kỹ năng</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#explore"
                className="bg-ink hover:bg-[#2C4A3B] active:bg-[#1e3529] text-white text-[10px] font-sans font-bold uppercase tracking-[0.15em] px-8 py-4 transition-colors duration-300 flex items-center justify-center gap-2 group cursor-pointer"
              >
                Khám phá sách
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform duration-300" />
              </a>
              <a
                href="#explore"
                className="border border-divider hover:border-ink text-ink text-[10px] font-sans font-bold uppercase tracking-[0.15em] px-8 py-4 transition-colors duration-300 flex items-center justify-center cursor-pointer hover:bg-stone-50"
              >
                Xem danh mục
              </a>
            </div>

            <div className="border-t border-divider-lt pt-8 grid grid-cols-3 gap-4">
              <div>
                <span className="block text-2xl md:text-3xl font-serif font-bold text-ink">500+</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-stone-500">Đầu sách</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-serif font-bold text-ink">2.400+</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-stone-500">Khách hàng</span>
              </div>
              <div>
                <span className="block text-2xl md:text-3xl font-serif font-bold text-ink flex items-center gap-1">
                  4.9 <Star size={16} fill="#2C4A3B" stroke="none" className="inline mb-1" />
                </span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-stone-500">Đánh giá</span>
              </div>
            </div>
          </div>

          {/* Right Column: Book Collage Grid */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0 flex justify-center">
            {/* Soft decorative background shape */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#faf8f5] to-[#f4f3ee] rounded-[30px] -z-10 blur-xl opacity-75"></div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-[420px] lg:max-w-none animate-float">
              {/* Vertical Stack Left: Tall image */}
              <div className="col-span-1 flex flex-col justify-center">
                <div className="aspect-[3/4.5] w-full overflow-hidden rounded-2xl shadow-lg border border-divider-lt group relative">
                  <img
                    src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=600"
                    alt="Khu rừng sương mù"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-white">Rừng sương tĩnh lặng</span>
                  </div>
                </div>
              </div>

              {/* Stack Right: Two smaller images */}
              <div className="col-span-1 flex flex-col gap-4">
                <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-md border border-divider-lt group relative">
                  <img
                    src="https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600"
                    alt="Khoảnh khắc tĩnh lặng"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-white">Tìm lại mình</span>
                  </div>
                </div>

                <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-md border border-divider-lt group relative">
                  <img
                    src="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600"
                    alt="Sách văn học tuyển chọn"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-white">Văn học tinh hoa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor's Picks Showcase Section */}
      {!searchTerm && !selectedCategory && featuredBooks && featuredBooks.length > 0 && (
        <div className="mb-24 w-full relative">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase block mb-3">
              Tuyển chọn độc quyền
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-ink uppercase tracking-wider">
              Lựa chọn của biên tập viên
            </h2>
            <div className="w-12 h-[1.5px] bg-[#2C4A3B] mx-auto mt-4"></div>
          </div>

          {/* Premium Editorial Shelf Container */}
          {/* Desktop Version */}
          <div className="hidden lg:block bg-[#faf8f5] border border-divider-lt rounded-[32px] p-12 shadow-sm relative overflow-hidden">

            {/* The 4-Column Shelf Grid */}
            <div className="grid grid-cols-4 gap-8 relative z-10">
              {featuredBooks.map((item) => (
                <div key={item.id} className="flex flex-col justify-between group h-full">
                  <div className="flex flex-col">
                    {/* Centered book display on shelf */}
                    <div className="h-64 flex items-end justify-center mb-8 relative">
                      {/* Realistic book shadow casting downwards */}
                      <div className="absolute bottom-0 w-28 h-4 bg-stone-900/10 rounded-full blur-[8px] transform translate-y-2 group-hover:scale-110 transition-transform duration-500"></div>

                      <Link to={`/books/${item.hashId || item.id}`} className="block relative z-10 w-40 aspect-[3/4.3] overflow-hidden rounded-[2px_8px_8px_2px] shadow-[0_12px_28px_rgba(0,0,0,0.12)] border-l-2 border-l-stone-900/10 group-hover:-translate-y-2 group-hover:shadow-[0_20px_35px_rgba(0,0,0,0.16)] transition-all duration-500 ease-out cursor-pointer">
                        <img
                          src={item.cover_url ? getImageUrl(item.cover_url) : `https://picsum.photos/seed/${item.id + 10}/800/1000`}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    </div>

                    {/* Shelf Line */}
                    <div className="w-full h-[1px] bg-divider mb-6"></div>

                    {/* Typographic Metadata */}
                    <div className="text-left px-1">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-stone-500 block mb-1">
                        {item.author}
                      </span>
                      <Link to={`/books/${item.hashId || item.id}`} className="font-serif text-base font-bold text-stone-900 leading-snug hover:text-[#2C4A3B] transition-colors line-clamp-2 min-h-[2.75rem] block cursor-pointer">
                        {item.title}
                      </Link>
                      <span className="text-[10px] text-stone-400 block mt-1">
                        {item.categories?.[0]?.name || 'Tác phẩm'}
                      </span>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mt-2.5">
                        <div className="flex text-[#2C4A3B] text-[10px]">
                          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                        </div>
                        <span className="text-[9px] font-bold text-stone-500 mt-0.5">4.9</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="px-1 mt-6">
                    <div className="flex items-center justify-between border-t border-divider-lt pt-4 w-full">
                      <span className="text-sm font-serif font-bold text-[#2C4A3B]">
                        {Number(item.price).toLocaleString('vi-VN')} đ
                      </span>

                      {item.available_qty <= 0 ? (
                        <span className="text-[9px] bg-red-50 border border-red-200 text-red-600 px-2.5 py-0.5 font-sans font-bold uppercase tracking-wider">Hết hàng</span>
                      ) : (
                        <span className="text-[9px] text-[#2C4A3B] font-bold uppercase tracking-wider">Còn hàng</span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(item.hashId || item.id, item.title)}
                      disabled={item.available_qty <= 0}
                      className="w-full py-2.5 border border-[#2C4A3B] text-[#2C4A3B] hover:bg-[#2C4A3B] hover:text-white transition-all text-[9px] font-sans font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 mt-4 rounded-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-transparent"
                    >
                      <ShoppingCart size={11} />
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile version: Aesthetic Horizontal Slider */}
          <div className="lg:hidden w-full overflow-x-auto snap-x snap-mandatory flex gap-6 pb-6 scroll-smooth hide-scrollbar px-1">
            {featuredBooks.map((item) => (
              <div key={item.id} className="snap-center shrink-0 w-64 p-5 rounded-2xl border border-divider-lt bg-white text-stone-850 flex flex-col justify-between shadow-xs">
                <div className="flex flex-col items-center">
                  {/* Book Cover Frame */}
                  <Link to={`/books/${item.hashId || item.id}`} className="w-28 aspect-[3/4.2] overflow-hidden rounded-lg shadow-md border border-divider-lt block cursor-pointer">
                    <img
                      src={item.cover_url ? getImageUrl(item.cover_url) : `https://picsum.photos/seed/${item.id + 10}/800/1000`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="mt-4 text-center w-full">
                    <span className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#2C4A3B] block mb-1">
                      {item.author}
                    </span>
                    <Link to={`/books/${item.hashId || item.id}`} className="font-serif text-sm font-bold truncate w-full block hover:underline cursor-pointer text-stone-900">
                      {item.title}
                    </Link>
                    <p className="text-[10px] font-sans tracking-wide mt-0.5 truncate w-full text-stone-500">
                      {item.categories?.[0]?.name || 'Tác phẩm'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="border-t my-3 border-divider-lt"></div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-serif font-bold text-stone-850">
                      {Number(item.price).toLocaleString('vi-VN')} đ
                    </span>

                    {item.available_qty <= 0 ? (
                      <span className="text-[8px] bg-red-50 border border-red-200 text-red-600 px-1.5 py-0.5 font-sans font-bold uppercase tracking-wider">Hết</span>
                    ) : (
                      <button
                        onClick={() => addToCart(item.hashId || item.id, item.title)}
                        className="py-1.5 px-3 text-[9px] font-sans font-bold uppercase tracking-wider flex items-center gap-1 transition-colors border border-[#2C4A3B] text-[#2C4A3B] hover:bg-[#2C4A3B] hover:text-white bg-transparent cursor-pointer rounded-none"
                      >
                        <ShoppingCart size={10} />
                        Mua
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div id="explore" className="scroll-mt-24"></div>

      {/* Categories Pills */}
      <div className="mb-6 max-w-6xl mx-auto w-full px-1">
        <div className="flex flex-row overflow-x-auto md:flex-wrap gap-2 justify-start pb-3 md:pb-0 hide-scrollbar w-full">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer shrink-0 ${selectedCategory === null
                ? 'bg-[#2C4A3B] text-white border-[#2C4A3B] shadow-sm'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
              }`}
          >
            Tất cả
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer shrink-0 ${selectedCategory === cat.id
                  ? 'bg-[#2C4A3B] text-white border-[#2C4A3B] shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Filter Tools Panel */}
      <div className="bg-white border border-stone-200 p-5 mb-16 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <input
            id="homepage-search-input"
            type="text"
            placeholder="Tìm tên sách, tác giả..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 text-stone-800 text-xs font-sans placeholder-stone-400 focus:bg-white focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] outline-none transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <Search size={14} />
          </span>
        </div>


        {/* Price Slider */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1 max-w-md px-1">
          <div className="flex justify-between items-center w-full sm:w-auto gap-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap">
              Giá tối đa:
            </span>
            <span className="text-xs font-serif font-bold text-[#2C4A3B] bg-[#2C4A3B]/5 border border-[#2C4A3B]/10 px-2 py-0.5 min-w-[90px] text-center">
              {maxPrice === 500000 ? 'Tất cả' : `${Number(maxPrice).toLocaleString('vi-VN')} đ`}
            </span>
          </div>
          <div className="flex-1 w-full flex items-center gap-2">
            <span className="text-[9px] text-stone-400 font-mono">20k</span>
            <input
              type="range"
              min="20000"
              max="500000"
              step="10000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="flex-grow accent-[#2C4A3B] cursor-pointer h-1 bg-stone-100 rounded-lg appearance-none"
            />
            <span className="text-[9px] text-stone-400 font-mono">500k</span>
          </div>
        </div>

        {/* Sort Selector */}
        <div className="relative w-full sm:w-auto md:w-48">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 text-[#2C4A3B] text-[10px] font-sans font-bold uppercase tracking-wider pl-3 pr-8 py-2.5 focus:bg-white focus:border-[#2C4A3B] outline-none cursor-pointer transition-all appearance-none"
          >
            <option value="newest">📅 Mới nhất</option>
            <option value="oldest">⌛ Cũ nhất</option>
            <option value="price_asc">📈 Giá: Thấp - Cao</option>
            <option value="price_desc">📉 Giá: Cao - Thấp</option>
          </select>
          {/* Custom Chevron Arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Trạng thái tải dữ liệu lần đầu (Skeleton Loading) */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col space-y-5">
              <div className="w-full aspect-[4/5] bg-stone-200 animate-pulse"></div>
              <div className="h-5 bg-stone-200 w-3/4 rounded"></div>
              <div className="border-t border-stone-200 pt-3 flex justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="h-3.5 bg-stone-200 w-1/3 rounded"></div>
                  <div className="h-3 bg-stone-200 w-1/2 rounded"></div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-3.5 bg-stone-200 w-16 rounded"></div>
                  <div className="h-3 bg-stone-200 w-10 rounded"></div>
                </div>
              </div>
              <div className="h-9 bg-stone-200 w-full mt-1 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Trạng thái lỗi */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-center font-medium max-w-lg mx-auto text-xs uppercase tracking-wider font-sans">
          ❌ Lỗi kết nối Cơ sở dữ liệu. Vui lòng kiểm tra lại Backend.
        </div>
      )}

      {/* Trạng thái không có dữ liệu */}
      {!isLoading && !isError && books?.length === 0 && (
        <div className="py-12 border-t border-divider-lt mt-4">
          <div className="text-center py-12 max-w-md mx-auto">
            <span className="text-4xl block mb-4">🔍</span>
            <h3 className="font-serif text-2xl uppercase tracking-wider text-ink mb-3">Không tìm thấy kết quả</h3>
            <p className="text-xs uppercase tracking-widest font-sans text-ink-60 leading-relaxed">
              Chúng tôi không tìm thấy cuốn sách nào phù hợp với tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc xem danh sách gợi ý dưới đây.
            </p>
          </div>

          {/* Section: Có thể bạn sẽ thích */}
          <div className="mt-16 pt-16 border-t border-divider">
            <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase block text-center mb-4">
              Gợi ý cho bạn
            </span>
            <h4 className="font-serif text-3xl uppercase tracking-wider text-center mb-12 text-ink">
              Có thể bạn sẽ thích
            </h4>

            {recommendedBooks && recommendedBooks.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
                {recommendedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-ink-60 uppercase text-xs tracking-widest font-sans animate-pulse">
                Đang tải gợi ý...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hiển thị danh sách sách */}
      {!isLoading && !isError && books?.length > 0 && (
        <>
          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12 transition-opacity duration-300 ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-3 mt-16 pt-8 border-t border-stone-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#2C4A3B]/5 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer bg-white"
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            {renderPageNumbers()}

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(books?.length || 0) < 8 || isFetching}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#2C4A3B]/5 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer bg-white"
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* Featured Articles (Bài viết nổi bật) Section */}
      <section id="blog" className="mt-24 pt-20 border-t border-divider scroll-mt-28 w-full">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="text-left">
            <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase block mb-3">
              Góc đọc sách
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-ink uppercase tracking-wider font-bold">
              Bài viết nổi bật
            </h2>
            <p className="text-xs text-stone-500 font-sans tracking-wide mt-2">
              Cảm nhận, gợi ý và câu chuyện truyền cảm hứng từ đội ngũ Pigeon Bookstore
            </p>
          </div>

          <Link
            to="/blog"
            className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#2C4A3B] hover:text-[#1e3529] transition-colors flex items-center gap-1 group cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            Xem tất cả
            <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* 3-Column Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article) => {
            const dateFormatted = article.created_at
              ? new Date(article.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
              : '';
            return (
              <Link
                key={article.id}
                to={`/blog/${article.hashId || article.id}`}
                className="flex flex-col group cursor-pointer"
              >
                <div className="aspect-[16/10] overflow-hidden rounded-2xl shadow-sm border border-divider-lt mb-5 relative bg-stone-100">
                  <img
                    src={getImageUrl(article.cover_url)}
                    alt={article.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                </div>

                <div className="text-left px-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#2C4A3B]">
                      {article.category}
                    </span>
                    {article.is_featured && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-bold text-amber-800 bg-amber-100 border border-amber-200 uppercase tracking-wider rounded-full">
                        📌 Nổi bật
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug group-hover:text-[#2C4A3B] transition-colors mb-2.5 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4 font-sans font-normal">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-stone-400 font-sans tracking-wide">
                    {dateFormatted && <span>{dateFormatted}</span>}
                    {dateFormatted && article.reading_time && <span>•</span>}
                    {article.reading_time && <span>{article.reading_time}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
          {articles.length === 0 && (
            <div className="col-span-3 text-center py-10 text-stone-400 italic">
              Chưa có bài viết nổi bật nào.
            </div>
          )}
        </div>
      </section>

      {/* About Us (Về chúng tôi) Section */}
      <section id="about" className="mt-28 pt-20 border-t border-divider scroll-mt-28 w-full mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Story & Philosophy */}
          <div className="lg:col-span-6 flex flex-col text-left">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[1px] bg-[#2C4A3B]"></span>
              <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase">
                Về chúng tôi
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-serif text-ink leading-tight mb-6 tracking-wide uppercase font-bold">
              Kỳ quan nhỏ bé <br />
              <span className="italic font-normal text-[#2C4A3B] lowercase block mt-2">giữa lòng người đọc sách</span>
            </h2>
            
            <div className="space-y-5 text-xs md:text-sm text-stone-600 font-sans tracking-wide leading-relaxed">
              <p>
                Tại <strong>Pigeon Bookstore</strong>, chúng tôi tin rằng mỗi cuốn sách không chỉ đơn thuần là những trang giấy in mực, mà là một sinh mệnh chứa đựng những thế giới tinh thần kỳ diệu, một lời mời gọi bước vào những hành trình khám phá và suy ngẫm sâu sắc.
              </p>
              <p>
                Được thành lập từ tình yêu vô hạn với tri thức, chúng tôi theo đuổi một triết lý tuyển chọn nghiêm ngặt. Từng tác phẩm trên giá sách của Pigeon đều được chắt lọc tỉ mỉ bởi đội ngũ biên tập chuyên nghiệp — từ văn học kinh điển, triết học sâu lắng đến những kiến thức khoa học hiện đại, đảm bảo mỗi cuốn sách đến tay bạn đều là một trải nghiệm đọc đắt giá nhất.
              </p>
              <p className="italic text-[#2C4A3B] font-serif border-l-2 border-[#2C4A3B] pl-4 my-6">
                “Chúng tôi không bán sách, chúng tôi chia sẻ những người bạn tri kỷ cho tâm hồn bạn.”
              </p>
            </div>
            
            {/* Core Values / Stats Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-divider-lt">
              <div className="text-left">
                <span className="font-serif text-2xl font-bold text-[#2C4A3B] block">100%</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-stone-400 block mt-1">Tuyển chọn</span>
              </div>
              <div className="text-left">
                <span className="font-serif text-2xl font-bold text-[#2C4A3B] block">5k+</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-stone-400 block mt-1">Độc giả tin yêu</span>
              </div>
              <div className="text-left">
                <span className="font-serif text-2xl font-bold text-[#2C4A3B] block">24/7</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-stone-400 block mt-1">Tư vấn tận tâm</span>
              </div>
            </div>
          </div>
          
          {/* Right Column: Editorial Photo Frame */}
          <div className="lg:col-span-6 relative">
            {/* Decorative background outline box */}
            <div className="absolute -inset-4 border border-[#2C4A3B]/10 rounded-2xl -rotate-1 pointer-events-none translate-x-2 translate-y-2"></div>
            
            {/* Main Image Container */}
            <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-md border border-divider-lt relative bg-stone-100 group">
              <img
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800"
                alt="Không gian Pigeon Bookstore cổ điển"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              {/* Subtle visual gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
            </div>
            
            {/* Floating visual card badge */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-[#2C4A3B]/10 p-5 shadow-lg rounded-xl max-w-[200px] hidden md:block">
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#c5a880] block mb-1">
                Không gian đọc
              </span>
              <p className="font-serif text-xs italic text-stone-850 leading-relaxed">
                Nơi yên bình lắng nghe thanh âm của tri thức.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}