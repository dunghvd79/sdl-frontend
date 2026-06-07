import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/image';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Star, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Type, 
  Sun, 
  Moon, 
  Coffee,
  MessageSquare,
  ShieldCheck,
  BookMarked
} from 'lucide-react';

export default function MyShelfPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [aiOnlyFilter, setAiOnlyFilter] = useState(false);
  const [selectedReaderBook, setSelectedReaderBook] = useState(null);
  const [selectedReviewBook, setSelectedReviewBook] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 1. Fetch user orders to verify ownership
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['shelfOrders'],
    queryFn: () => api.get('/orders').then(r => r.data.data),
    enabled: !!user
  });

  // 2. Fetch all books from store
  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['shelfAllBooks'],
    queryFn: () => api.get('/books?limit=300').then(r => r.data.data?.books || r.data.data || []),
    enabled: !!user
  });

  const orders = ordersData || [];
  const allBooks = booksData || [];

  // Extract uniquely owned book IDs from successfully delivered orders
  const ownedBookIds = new Set();
  orders.forEach(order => {
    if (order.status === 'DELIVERED') {
      order.items?.forEach(item => {
        ownedBookIds.add(String(item.hashId || item.bookId));
      });
    }
  });

  // Map owned book IDs back to detailed store book objects
  const purchasedBooks = allBooks.filter(book => ownedBookIds.has(String(book.hashId || book.id)));

  // Apply search and filter criteria
  const filteredBooks = purchasedBooks.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAi = aiOnlyFilter ? !!book.rag_indexed_at : true;
    return matchesSearch && matchesAi;
  });

  const isLoading = ordersLoading || booksLoading;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full bg-[#fdfcfa]">
      
      {/* Header section with bookish theme */}
      <div className="mb-10 text-center relative max-w-xl mx-auto">
        <span className="text-[10px] text-stone-500 font-sans tracking-[0.25em] uppercase font-bold">Thư viện số cá nhân</span>
        <h1 className="text-3xl font-serif font-bold text-ink uppercase tracking-widest mt-1.5 mb-3 relative inline-block">
          Tủ Sách Của Tôi
        </h1>
        <p className="text-xs text-stone-500 font-serif italic leading-relaxed">
          Không gian lưu trữ các tác phẩm số đã mua — Đọc sách trực tuyến và trao đổi tri thức cùng Trợ lý AI thông minh.
        </p>
        <div className="w-16 h-[2px] bg-[#2C4A3B] mx-auto mt-4"></div>
      </div>

      {/* Toolbar for search & filter */}
      <div className="bg-[#faf8f5] border border-divider p-4 mb-10 flex flex-col md:flex-row justify-between items-center gap-4 rounded-none shadow-none">
        
        {/* Search Input */}
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="Tìm kiếm sách trên kệ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-stone-200 bg-white rounded-none py-2.5 pl-10 pr-4 text-xs font-sans focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] transition-all text-ink placeholder:text-stone-400"
          />
          <Search size={15} className="absolute left-3.5 top-3 text-stone-400" />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aiOnlyFilter}
              onChange={(e) => setAiOnlyFilter(e.target.checked)}
              className="w-4 h-4 accent-[#2C4A3B] rounded-none cursor-pointer"
            />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#2C4A3B]" /> Chỉ sách có hỗ trợ AI
            </span>
          </label>
        </div>
      </div>

      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse space-y-4">
              <div className="aspect-[3/4] bg-[#f0ece7] border border-divider-lt"></div>
              <div className="h-4 bg-[#f0ece7] w-3/4 mx-auto"></div>
              <div className="h-3 bg-[#f0ece7] w-1/2 mx-auto"></div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        /* Bookshelf grid layout */
        <div className="space-y-12">
          
          {/* Books Shelf Line Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12 relative">
            {filteredBooks.map(book => {
              const hasAi = !!book.rag_indexed_at;
              const bookCover = book.cover_url ? getImageUrl(book.cover_url) : `https://picsum.photos/seed/${book.id}/300/450`;
              
              return (
                <div 
                  key={book.id} 
                  className="flex flex-col group transition-all duration-300 relative text-center"
                >
                  {/* Book cover frame with 3D spine and shadow */}
                  <div className="w-full aspect-[3/4] border border-divider bg-white flex items-center justify-center overflow-hidden mb-4 relative group-hover:-translate-y-2.5 transition-all duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.06)] group-hover:shadow-[0_16px_30px_rgba(44,74,59,0.12)] rounded-sm">
                    <img 
                      src={bookCover} 
                      alt={book.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${book.id}/300/450`; }}
                    />
                    
                    {/* Premium 3D Book Spine Shadow */}
                    <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-r from-black/20 via-black/5 to-transparent z-10" />

                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-[#1e2e25]/85 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center gap-3 transition-opacity duration-300 p-4 z-20">
                      
                      <button
                        onClick={() => setSelectedReaderBook(book)}
                        className="w-full bg-[#2C4A3B] hover:bg-[#1e3529] text-white py-2.5 rounded-none font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 border border-transparent"
                      >
                        <BookOpen size={13} /> Đọc Sách
                      </button>
                      
                      {hasAi ? (
                        <button
                          onClick={() => navigate(`/books/${book.hashId || book.id}/chat`)}
                          className="w-full bg-white hover:bg-[#faf8f5] text-ink py-2.5 rounded-none font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 border border-stone-200"
                        >
                          <Sparkles size={13} className="text-[#2C4A3B]" /> Hỏi Đáp AI
                        </button>
                      ) : (
                        <span className="w-full bg-stone-300/70 text-stone-600 text-center py-2.5 text-[9px] uppercase font-bold tracking-wider cursor-not-allowed select-none">
                          Chưa tích hợp AI
                        </span>
                      )}
                      
                      <button
                        onClick={() => setSelectedReviewBook(book)}
                        className="w-full bg-transparent hover:bg-white/10 text-white border border-white/40 py-2 rounded-none font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <Star size={11} className="fill-white" /> Viết Đánh Giá
                      </button>
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-sm text-ink group-hover:text-[#2C4A3B] transition-colors line-clamp-2 uppercase tracking-wider leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-[9px] text-stone-400 font-sans uppercase tracking-widest mt-1 mb-2 font-bold">
                        {book.author || 'Khuyết Danh'}
                      </p>
                    </div>
                    
                    <div className="mt-1 flex justify-center">
                      {hasAi ? (
                        <span className="inline-flex items-center text-[8px] font-bold px-2 py-0.5 border border-green-200 text-green-700 bg-green-50 uppercase tracking-widest gap-1">
                          <Sparkles size={8} /> Sẵn sàng AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[8px] font-bold px-2 py-0.5 border border-stone-200 text-stone-400 bg-stone-50 uppercase tracking-widest">
                          Sách Thường
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      ) : (
        /* Empty Bookshelf view */
        <div className="text-center py-16 bg-white border border-divider rounded-none max-w-lg mx-auto shadow-none">
          <div className="w-16 h-16 bg-[#2C4A3B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookMarked className="text-[#2C4A3B] w-8 h-8" />
          </div>
          <h3 className="font-serif font-bold text-lg text-ink uppercase tracking-wider mb-2">Tủ sách của bạn trống</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed mb-8 font-sans">
            {searchTerm || aiOnlyFilter 
              ? 'Không tìm thấy ấn phẩm nào phù hợp với điều kiện lọc trên kệ sách.' 
              : 'Bạn chưa sở hữu tác phẩm số nào. Hãy đặt mua sách và đợi giao thành công để mở khóa tủ sách!'}
          </p>
          {!searchTerm && !aiOnlyFilter && (
            <button
              onClick={() => navigate('/')}
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-3.5 px-8 rounded-none text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-[0_4px_12px_rgba(44,74,59,0.15)]"
            >
              Khám Phá Sách Ngay
            </button>
          )}
        </div>
      )}

      {/* Reader Modal integration */}
      {selectedReaderBook && (
        <BookReaderModal
          book={selectedReaderBook}
          onClose={() => setSelectedReaderBook(null)}
          onAiConsult={() => {
            const bookId = selectedReaderBook.hashId || selectedReaderBook.id;
            setSelectedReaderBook(null);
            navigate(`/books/${bookId}/chat`);
          }}
        />
      )}

      {/* Quick Review Modal integration */}
      {selectedReviewBook && (
        <ShelfReviewModal
          book={selectedReviewBook}
          onClose={() => setSelectedReviewBook(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-component: Giao diện giả lập đọc sách E-book cao cấp (Kindle Style) ─────
function BookReaderModal({ book, onClose, onAiConsult }) {
  const [fontSize, setFontSize] = useState(15); // default 15px
  const [theme, setTheme] = useState('warm'); // warm | dark | white
  const [activeChapter, setActiveChapter] = useState(1);
  const [progress, setProgress] = useState(20);

  // Dynamic progress depending on chapter
  useEffect(() => {
    setProgress(activeChapter * 20);
  }, [activeChapter]);

  // Color schemes for book themes
  const themeStyles = {
    warm: {
      bg: 'bg-[#fdf9f3] text-stone-900 border-stone-200/60',
      panel: 'bg-[#faf3e8] text-stone-700 border-stone-200/60',
      menuBg: 'bg-[#fdf9f3]',
      activeTab: 'bg-[#efe5d3] border-[#2C4A3B] text-stone-900 font-bold',
      tab: 'hover:bg-[#f3ead7] text-stone-600',
    },
    dark: {
      bg: 'bg-[#151515] text-stone-300 border-stone-800/80',
      panel: 'bg-[#1d1d1d] text-stone-400 border-stone-800/80',
      menuBg: 'bg-[#151515]',
      activeTab: 'bg-[#2b2b2b] border-[#2C4A3B] text-white font-bold',
      tab: 'hover:bg-[#222] text-stone-500',
    },
    white: {
      bg: 'bg-white text-stone-900 border-stone-100',
      panel: 'bg-[#fafafa] text-stone-600 border-stone-100',
      menuBg: 'bg-white',
      activeTab: 'bg-[#f0f0f0] border-[#2C4A3B] text-stone-900 font-bold',
      tab: 'hover:bg-[#f6f6f6] text-stone-500',
    }
  }[theme];

  // Immersive text mockup depending on the book
  const mockChaptersContent = {
    1: {
      title: 'Chương 1: Những tiền đề đầu tiên',
      content: `Vũ trụ văn học luôn là một ẩn số kỳ bí, nơi những linh hồn tìm thấy điểm tựa của mình. Cuốn sách "${book.title}" mở ra cho độc giả một góc nhìn đầy mới lạ, dẫn dắt chúng ta đi từ những băn khoăn trăn trở của cuộc sống thường nhật đến với các triết lý nhân sinh sâu sắc.

Từ những trang viết đầu tiên, tác giả đã khéo léo gieo vào lòng người đọc những nút thắt nhỏ. Nhân vật được phác họa tinh tế, không quá cầu kỳ nhưng đủ để khơi dậy sự tò mò. Mọi biến cố trong chương mở đầu này giống như một cơn gió nhẹ trước giông bão, chuẩn bị cho một hành trình đầy cam go phía trước.`
    },
    2: {
      title: 'Chương 2: Diễn biến tâm lý & Biến cố khởi đầu',
      content: `Sự va chạm giữa các giá trị sống là chủ đề chính được khắc họa đậm nét trong chương này. Nhân vật đối diện với sự lựa chọn đầy nghiệt ngã, nơi ranh giới giữa cái đúng và cái sai, giữa tình cảm cá nhân và trách nhiệm xã hội trở nên vô cùng mong manh.

Tác giả tiếp tục phát triển văn phong giàu tính triết lý của mình. Từng câu chữ trôi chảy tựa dòng sông, nhưng bên dưới là những đợt sóng ngầm tâm lý dữ dội. Đây là thời khắc nhân vật tự nhìn nhận lại chính mình, để từ đó bứt phá ra khỏi những định kiến thông thường.`
    },
    3: {
      title: 'Chương 3: Những nút thắt kịch tính',
      content: `Càng đi sâu vào tác phẩm, bức tranh toàn cảnh càng hiện lên rõ nét hơn. Các mối quan hệ đan xen chồng chéo tạo nên một mạng lưới kịch tính. Bất kỳ một hành động nhỏ nào cũng có thể châm ngòi cho những xung đột không thể hàn gắn.

Sách mang đến cho chúng ta cảm giác như đang trực tiếp đồng hành cùng nhân vật. Tiếng thở dài trong đêm tối, sự im lặng đầy căng thẳng hay những cuộc đối thoại nảy lửa đều được tái hiện chân thực trên từng thớ giấy.`
    },
    4: {
      title: 'Chương 4: Cao trào & Sự thật phơi bày',
      content: `Mọi bí mật che giấu cuối cùng đều được đưa ra ánh sáng. Chương 4 là đỉnh điểm của toàn bộ mạch truyện, nơi những mâu thuẫn đẩy lên đỉnh cao buộc phải được giải quyết. Tác giả khéo léo cài cắm các tình tiết bất ngờ (plot twist) khiến độc giả không khỏi ngỡ ngàng.

Không chỉ đơn thuần là giải quyết mâu thuẫn cốt truyện, chương này còn là bài kiểm tra đạo đức nặng nề nhất đối với lương tâm của các nhân vật.`
    },
    5: {
      title: 'Chương 5: Kết cục & Bài học nhân sinh',
      content: `Sau cơn mưa trời lại sáng. Mọi biến cố đã trôi qua, để lại những vết sẹo nhưng đi kèm với đó là sự trưởng thành vượt bậc về tâm hồn. Kết thúc của tác phẩm mang tính gợi mở sâu sắc, gieo vào lòng người đọc những suy ngẫm khôn nguôi về cuộc đời và con người.

Cuốn sách "${book.title}" của tác giả ${book.author || 'Khuyết Danh'} thực sự là một đóa hoa thơm trong lòng độc giả, xứng đáng để chúng ta đọc lại nhiều lần để chiêm nghiệm những giá trị vĩnh hằng mà nó mang lại.`
    }
  }[activeChapter];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden font-sans">
      <div className="bg-white border border-divider w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden rounded-none animate-fadeIn">
        
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 border-b border-divider bg-[#faf8f5] flex-shrink-0 gap-3 w-full">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold border border-stone-200 px-2 py-0.5 bg-white uppercase tracking-widest text-[#2C4A3B] flex items-center gap-1">
              <BookMarked size={10} /> Đọc sách số
            </span>
            <h4 className="text-xs font-serif font-bold text-ink line-clamp-1 uppercase tracking-wide">
              {book.title} <span className="font-sans font-normal text-stone-400 text-[10px]">({book.author || 'Tác giả'})</span>
            </h4>
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Font size control */}
            <div className="flex items-center border border-stone-200 bg-white">
              <button 
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                className="px-2.5 py-1 border-r border-stone-200 hover:bg-stone-50 font-bold text-ink cursor-pointer flex items-center gap-0.5 text-[10px]"
                title="Giảm cỡ chữ"
              >
                <Type size={11} /> -
              </button>
              <span className="px-2 py-1 font-mono text-[9px] text-stone-500 bg-stone-50 select-none font-bold">
                {fontSize}px
              </span>
              <button 
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="px-2.5 py-1 border-l border-stone-200 hover:bg-stone-50 font-bold text-ink cursor-pointer flex items-center gap-0.5 text-[10px]"
                title="Tăng cỡ chữ"
              >
                <Type size={11} /> +
              </button>
            </div>

            {/* Theme switcher */}
            <div className="flex border border-stone-200 bg-white p-0.5 gap-0.5">
              <button 
                onClick={() => setTheme('warm')}
                className={`w-6 h-6 rounded-none bg-[#fdf9f3] border ${theme === 'warm' ? 'border-[#2C4A3B]' : 'border-transparent'} cursor-pointer flex items-center justify-center`}
                title="Nền ấm áp"
              >
                <Coffee size={10} className="text-amber-800" />
              </button>
              <button 
                onClick={() => setTheme('white')}
                className={`w-6 h-6 rounded-none bg-white border ${theme === 'white' ? 'border-[#2C4A3B]' : 'border-stone-200'} cursor-pointer flex items-center justify-center`}
                title="Nền sáng"
              >
                <Sun size={11} className="text-orange-500" />
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`w-6 h-6 rounded-none bg-[#151515] border ${theme === 'dark' ? 'border-[#2C4A3B]' : 'border-transparent'} cursor-pointer flex items-center justify-center`}
                title="Nền tối"
              >
                <Moon size={11} className="text-stone-400" />
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="text-stone-400 hover:text-ink transition-colors p-1 cursor-pointer ml-2 bg-transparent border-0"
              title="Đóng trình đọc"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Reader Layout Splitter */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Table of Contents */}
          <div className={`w-56 flex-shrink-0 border-r ${themeStyles.bg} overflow-y-auto hidden md:flex flex-col p-4 space-y-4`}>
            <h5 className="text-[9px] uppercase tracking-widest font-bold opacity-60 mb-2">Mục lục tác phẩm</h5>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map(ch => (
                <button
                  key={ch}
                  onClick={() => setActiveChapter(ch)}
                  className={`w-full text-left py-2.5 px-3 text-xs font-semibold border-l-2 transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis rounded-none ${
                    activeChapter === ch 
                      ? themeStyles.activeTab
                      : themeStyles.tab + ' border-transparent'
                  }`}
                >
                  Chương {ch}: {ch === 1 ? 'Tiền đề' : ch === 2 ? 'Biến cố' : ch === 3 ? 'Nút thắt' : ch === 4 ? 'Cao trào' : 'Kết cục'}
                </button>
              ))}
            </div>
          </div>

          {/* Center Immersive Page Screen */}
          <div className={`flex-1 flex flex-col overflow-hidden ${themeStyles.bg} transition-colors duration-200`}>
            {/* Reading progress header */}
            <div className="px-8 py-3.5 border-b border-divider/10 flex justify-between items-center text-[9px] uppercase font-mono tracking-widest opacity-60 font-bold select-none">
              <span>{mockChaptersContent.title}</span>
              <span>Đã hoàn thành {progress}%</span>
            </div>

            {/* Simulated Paper Book Page Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 md:p-14 font-serif leading-relaxed max-w-2xl mx-auto w-full transition-all duration-150">
              <h2 className="text-xl md:text-2xl font-bold mb-6 border-b border-divider/10 pb-4 tracking-wide font-serif">
                {mockChaptersContent.title}
              </h2>
              <div 
                style={{ fontSize: `${fontSize}px` }}
                className="space-y-6 text-justify whitespace-pre-line leading-relaxed font-serif text-stone-800"
              >
                {mockChaptersContent.content}
              </div>
            </div>

            {/* Reading progress bar */}
            <div className="h-1 w-full bg-stone-200/20 flex-shrink-0">
              <div 
                className="h-full bg-[#2C4A3B] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer actions with RAG AI Consulting trigger */}
        <div className="bg-[#faf8f5] px-6 py-4 border-t border-divider flex flex-col sm:flex-row justify-between items-center flex-shrink-0 gap-3">
          <div className="text-xs text-stone-500 italic flex items-center gap-1 font-serif">
            <ShieldCheck size={14} className="text-[#2C4A3B]" /> Tác phẩm bản quyền thuộc sở hữu cá nhân của bạn.
          </div>
          <div className="flex gap-2.5">
            {book.rag_indexed_at && (
              <button
                onClick={onAiConsult}
                className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-2 px-5 rounded-none text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_3px_10px_rgba(44,74,59,0.15)]"
              >
                <MessageSquare size={13} /> Hỏi đáp trợ lý AI
              </button>
            )}
            <button
              onClick={onClose}
              className="border border-stone-200 hover:bg-[#f0ece7] text-ink font-bold py-2 px-5 rounded-none text-xs uppercase tracking-widest transition-colors cursor-pointer bg-white"
            >
              Đóng lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: Hộp thoại đánh giá nhanh từ tủ sách ───────────────────────
function ShelfReviewModal({ book, onClose }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const reviewMutation = useMutation({
    mutationFn: (payload) => api.post(`/books/${book.hashId || book.id}/reviews`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['shelfOrders']);
      toast.success(`Đã đăng đánh giá cho sách "${book.title}" thành công!`, { title: 'Thành công' });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi đăng đánh giá' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn đánh giá từ 1 đến 5 sao!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (!comment || comment.trim().length < 10) {
      toast.error('Nội dung nhận xét phải có ít nhất 10 ký tự!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (comment.trim().length > 1000) {
      toast.error('Nội dung bình luận quá dài! Tối đa 1000 ký tự.', { title: 'Lỗi nhập liệu' });
      return;
    }
    reviewMutation.mutate({ rating, comment: comment.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-divider w-full max-w-md shadow-2xl flex flex-col rounded-none animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider bg-[#faf8f5]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#2C4A3B] font-semibold mb-0.5">Đánh giá tác phẩm</p>
            <h4 className="text-xs font-serif font-bold text-ink leading-tight uppercase tracking-wide">
              {book.title}
            </h4>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-ink transition-colors p-1 cursor-pointer bg-transparent border-0">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Star selector */}
          <div className="text-center space-y-2">
            <span className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold">
              Chọn mức độ hài lòng *
            </span>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = hoverRating ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 cursor-pointer transition-transform duration-100 hover:scale-125 bg-transparent border-0"
                  >
                    <svg
                      className={`w-8 h-8 ${isLit ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#2C4A3B] font-bold tracking-wider uppercase pt-1">
              {
                {
                  1: 'Rất tệ',
                  2: 'Tệ',
                  3: 'Bình thường',
                  4: 'Tốt',
                  5: 'Tuyệt vời'
                }[rating]
              }
            </p>
          </div>

          {/* Comment text area */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold">
              Nội dung nhận xét *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nghĩ của bạn về nội dung sách, chất lượng in ấn hoặc cảm xúc sau khi đọc xong..."
              rows="4"
              className="w-full border border-divider rounded-none px-3.5 py-2.5 text-xs text-ink focus:border-ink focus:outline-none bg-transparent placeholder:text-stone-400 font-sans"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-divider/50">
            <button
              type="button"
              onClick={onClose}
              className="border border-divider hover:bg-[#f0ece7] text-stone-600 font-bold py-2 px-4 rounded-none text-xs uppercase tracking-widest transition-colors cursor-pointer bg-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-2 px-5 rounded-none text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
            >
              {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
