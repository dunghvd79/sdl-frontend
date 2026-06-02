import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getImageUrl } from '../services/image';
import { Search, Clock, Calendar, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 6; // 6 articles per page for a balanced grid layout

  // Fetch articles with live search, category filter, and pagination
  const { data: responseData, isLoading, isFetching, isError } = useQuery({
    queryKey: ['blogArticles', searchTerm, selectedCategory, page],
    queryFn: async () => {
      const response = await api.get('/articles', {
        params: {
          search: searchTerm,
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          page: page,
          limit: limit,
          adminMode: false // strictly show only published articles
        }
      });
      return response.data;
    },
    placeholderData: (prev) => prev
  });

  const articles = responseData?.data || [];
  const totalCount = responseData?.total || articles.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Fetch 3 latest/featured articles as fallback suggestions when search results are empty
  const { data: suggestionsData } = useQuery({
    queryKey: ['blogSuggestions'],
    queryFn: async () => {
      const response = await api.get('/articles', {
        params: {
          limit: 3,
          adminMode: false
        }
      });
      return response.data?.data || [];
    }
  });
  const suggestions = suggestionsData || [];

  // Format date to local Vietnamese style
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} tháng ${month}, ${year}`;
  };

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
    setPage(1); // Reset to page 1 upon category filter switch
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on search text change
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full font-sans">
      {/* Editorial Page Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-3">
          <BookOpen size={16} className="text-[#2C4A3B]" />
          <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[#2C4A3B] uppercase">
            Góc đọc sách
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-ink uppercase tracking-wider font-bold mb-4">
          Tất cả bài viết
        </h1>
        <p className="text-xs md:text-sm text-stone-500 font-sans tracking-wide max-w-xl mx-auto leading-relaxed">
          Cảm nhận, gợi ý tuyển đọc sách tinh hoa và những câu chuyện truyền cảm hứng từ đội ngũ Pigeon Bookstore nhằm giúp bạn đồng hành trên con đường phát triển tri thức.
        </p>
        <div className="w-12 h-[1.5px] bg-[#2C4A3B] mx-auto mt-5"></div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-stone-200 p-5 mb-12 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
        {/* Category filtering pills */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
          {['ALL', 'Chiêm nghiệm', 'Gợi ý tuyển đọc', 'Kinh nghiệm'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer rounded-none ${
                selectedCategory === cat
                  ? 'bg-[#2C4A3B] text-white border-[#2C4A3B] shadow-sm'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả chuyên mục' : cat}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 text-stone-850 text-xs font-sans placeholder-stone-400 focus:bg-white focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] outline-none transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <Search size={14} />
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col space-y-4 animate-pulse">
              <div className="aspect-[16/10] bg-stone-200 rounded-2xl w-full"></div>
              <div className="h-4 bg-stone-200 w-1/4 rounded"></div>
              <div className="h-6 bg-stone-200 w-3/4 rounded"></div>
              <div className="h-4 bg-stone-200 w-full rounded"></div>
              <div className="h-3 bg-stone-200 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 text-center font-medium max-w-lg mx-auto text-xs uppercase tracking-wider font-sans">
          ❌ Không thể tải danh sách bài viết. Vui lòng kiểm tra lại kết nối mạng hoặc Backend.
        </div>
      )}

      {/* No articles state with recommendations */}
      {!isLoading && !isError && articles.length === 0 && (
        <div className="space-y-16">
          <div className="text-center py-16 max-w-md mx-auto border border-dashed border-stone-200 p-8 bg-stone-50/30">
            <span className="text-4xl block mb-4">🔍</span>
            <h3 className="font-serif text-xl uppercase tracking-wider text-stone-850 mb-2">Không tìm thấy bài viết nào</h3>
            <p className="text-xs font-sans text-stone-500 leading-relaxed uppercase tracking-wider">
              Thử tìm kiếm từ khóa khác hoặc chuyển sang chuyên mục khác để có thêm gợi ý đọc sách thú vị.
            </p>
          </div>

          {suggestions.length > 0 && (
            <div className="max-w-4xl mx-auto pt-10 border-t border-stone-100">
              <h3 className="font-serif text-lg font-bold text-center text-stone-800 mb-8 uppercase tracking-widest text-xs">
                Xem các bài viết gợi ý mới nhất
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {suggestions.map((article) => {
                  const dateFormatted = formatDate(article.created_at);
                  return (
                    <Link
                      key={article.id}
                      to={`/blog/${article.id}`}
                      className="flex flex-col group cursor-pointer"
                    >
                      <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-divider-lt mb-4 relative bg-stone-50 shadow-xs">
                        <img
                          src={getImageUrl(article.cover_url)}
                          alt={article.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-left px-1">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#2C4A3B] block mb-1.5">
                          {article.category}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-stone-900 leading-snug group-hover:text-[#2C4A3B] transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-stone-400 font-sans">
                          {dateFormatted && <span>{dateFormatted}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Articles grid */}
      {!isLoading && !isError && articles.length > 0 && (
        <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((article) => {
              const dateFormatted = formatDate(article.created_at);
              return (
                <Link
                  key={article.id}
                  to={`/blog/${article.id}`}
                  className="flex flex-col group cursor-pointer"
                >
                  {/* Article cover image with hover effects */}
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl shadow-sm border border-divider-lt mb-5 relative bg-stone-100">
                    <img
                      src={getImageUrl(article.cover_url)}
                      alt={article.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* Editorial Typography Details */}
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
                    <div className="flex items-center gap-4 text-[10px] text-stone-400 font-sans tracking-wide">
                      {dateFormatted && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {dateFormatted}
                        </span>
                      )}
                      {article.reading_time && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {article.reading_time}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Simple Clean Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-16 pt-8 border-t border-stone-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#2C4A3B]/5 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer bg-white"
                aria-label="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="font-sans text-xs font-bold text-stone-500 px-3 tracking-widest uppercase">
                Trang {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isFetching}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:border-[#2C4A3B] hover:text-[#2C4A3B] hover:bg-[#2C4A3B]/5 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer bg-white"
                aria-label="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
