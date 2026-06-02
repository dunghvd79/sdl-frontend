import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { getImageUrl } from '../services/image';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch article details using React Query
  const { data: article, isLoading, isError } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const response = await api.get(`/articles/${id}`);
      return response.data.data;
    }
  });

  const handleBack = () => {
    navigate('/blog');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 flex-grow w-full">
        {/* Loading skeleton */}
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-stone-200 rounded w-1/4"></div>
          <div className="h-10 bg-stone-200 rounded w-3/4"></div>
          <div className="h-4 bg-stone-200 rounded w-1/2"></div>
          <div className="aspect-[16/9] bg-stone-200 rounded-2xl w-full"></div>
          <div className="space-y-3 pt-6">
            <div className="h-4 bg-stone-200 rounded"></div>
            <div className="h-4 bg-stone-200 rounded"></div>
            <div className="h-4 bg-stone-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg inline-block border border-red-200">
          <p className="text-lg font-semibold">❌ Không tìm thấy bài viết này hoặc có lỗi kết nối.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Format date nicely in Vietnamese (e.g. 15 tháng 5, 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day} tháng ${month}, ${year}`;
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 flex-grow w-full">
      {/* Quay lại */}
      <button
        onClick={handleBack}
        className="mb-8 flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#2C4A3B] uppercase tracking-widest font-sans font-bold transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> Quay lại Góc đọc sách
      </button>

      {/* Main Content */}
      <article className="bg-white border border-divider rounded-none p-6 md:p-12 shadow-none">
        {/* Category Badge */}
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-[#2C4A3B] block mb-4">
          {article.category || 'Chiêm nghiệm'}
        </span>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-stone-900 leading-tight mb-6 uppercase tracking-wide">
          {article.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-stone-400 font-sans text-xs border-y border-divider-lt py-3 mb-8">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-stone-400" />
            {formatDate(article.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-stone-400" />
            {article.reading_time || '5 phút đọc'}
          </span>
        </div>

        {/* Summary Block */}
        {article.summary && (
          <div className="border-l-4 border-[#2C4A3B] pl-4 italic text-stone-600 font-serif text-base md:text-lg leading-relaxed mb-8 bg-[#faf8f5]/40 py-2 pr-2">
            {article.summary}
          </div>
        )}

        {/* Cover Image */}
        {article.cover_url && (
          <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-divider-lt mb-10 shadow-sm relative bg-stone-100">
            <img
              src={getImageUrl(article.cover_url)}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Full Rich Text Content */}
        <div className="prose prose-stone max-w-none">
          <div 
            className="text-stone-800 font-sans leading-relaxed text-sm md:text-base text-justify whitespace-pre-line space-y-6"
          >
            {article.content}
          </div>
        </div>
      </article>
    </div>
  );
}
