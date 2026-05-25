import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/image';

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
        ownedBookIds.add(Number(item.bookId));
      });
    }
  });

  // Map owned book IDs back to detailed store book objects
  const purchasedBooks = allBooks.filter(book => ownedBookIds.has(Number(book.id)));

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
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full">
      {/* Header section with bookish theme */}
      <div className="mb-10 text-center relative">
        <h1 className="text-3xl font-serif font-semibold text-ink uppercase tracking-widest relative inline-block mb-3">
          Tủ Sách Số Của Tôi
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-[#2C4A3B]"></span>
        </h1>
        <p className="text-xs text-ink-light font-serif italic mt-3">
          Không gian tri thức cá nhân — Đọc sách và thảo luận học thuật cùng Trợ lý AI
        </p>
      </div>

      {/* Toolbar for search & filter */}
      <div className="bg-white border border-divider p-5 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 rounded-none shadow-sm">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="Tìm kiếm sách trên kệ của bạn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-divider rounded-none py-2.5 px-4 text-sm focus:outline-none focus:border-ink bg-transparent text-ink placeholder:text-stone-400"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aiOnlyFilter}
              onChange={(e) => setAiOnlyFilter(e.target.checked)}
              className="rounded-none border-divider text-[#2C4A3B] focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-semibold text-ink-light uppercase tracking-wider">
              Chỉ sách sẵn sàng AI
            </span>
          </label>
        </div>
      </div>

      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[3/4] bg-[#f0ece7] rounded-none border border-divider-lt"></div>
              <div className="h-4 bg-[#f0ece7] rounded-none w-3/4"></div>
              <div className="h-3 bg-[#f0ece7] rounded-none w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        /* Virtual Wooden Bookshelf layout */
        <div className="space-y-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 relative">
            {filteredBooks.map(book => {
              const hasAi = !!book.rag_indexed_at;
              const bookCover = book.cover_url ? getImageUrl(book.cover_url) : `https://picsum.photos/seed/${book.id + 10}/300/450`;
              
              return (
                <div 
                  key={book.id} 
                  className="flex flex-col group transition-all duration-300 relative"
                >
                  {/* Aspect book cover frame with shadow and scale effect */}
                  <div className="w-full aspect-[3/4] border border-divider bg-[#faf8f5] flex items-center justify-center overflow-hidden mb-3 relative group-hover:-translate-y-2.5 transition-transform duration-300 shadow-md group-hover:shadow-xl">
                    <img 
                      src={bookCover} 
                      alt={book.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${book.id}/300/450`; }}
                    />
                    
                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center gap-2.5 transition-opacity duration-300 p-3">
                      <button
                        onClick={() => setSelectedReaderBook(book)}
                        className="w-full bg-[#2C4A3B] hover:bg-[#1e3529] text-white py-2 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center"
                      >
                        Đọc Sách
                      </button>
                      
                      {hasAi ? (
                        <button
                          onClick={() => navigate(`/books/${book.id}/chat`)}
                          className="w-full bg-white hover:bg-[#f0ece7] text-ink py-2 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center border border-divider"
                        >
                          Tư Vấn AI
                        </button>
                      ) : (
                        <span className="w-full bg-stone-300/80 text-stone-600 text-center py-2 text-[10px] uppercase font-bold tracking-wider cursor-not-allowed">
                          Chưa có AI
                        </span>
                      )}
                      
                      <button
                        onClick={() => setSelectedReviewBook(book)}
                        className="w-full bg-transparent hover:bg-white/10 text-white border border-white/60 py-2 rounded-none font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center"
                      >
                        Đánh Giá
                      </button>
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 flex flex-col text-center">
                    <h3 className="font-serif font-bold text-sm text-ink group-hover:text-[#2C4A3B] transition-colors line-clamp-2 uppercase tracking-wide leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-[10px] text-ink-light font-sans uppercase tracking-widest mt-1 mb-2">
                      {book.author || 'Khuyết Danh'}
                    </p>
                    
                    <div className="mt-auto flex justify-center gap-1.5">
                      {hasAi ? (
                        <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 border border-green-200 text-green-700 bg-green-50 uppercase tracking-wider">
                          Sẵn sàng AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 border border-divider text-stone-400 bg-stone-50 uppercase tracking-wider">
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
        <div className="text-center py-20 bg-white border border-divider rounded-none max-w-lg mx-auto">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="font-serif font-semibold text-lg text-ink uppercase tracking-wider mb-2">Tủ sách trống</h3>
          <p className="text-sm text-stone-400 max-w-sm mx-auto leading-relaxed mb-8">
            {searchTerm || aiOnlyFilter 
              ? 'Không tìm thấy ấn phẩm nào phù hợp với điều kiện tìm kiếm của bạn.' 
              : 'Bạn chưa mua cuốn sách điện tử hoặc sách giấy nào thành công. Hãy đặt mua ngay để mở khóa tủ sách!'}
          </p>
          {!searchTerm && !aiOnlyFilter && (
            <button
              onClick={() => navigate('/')}
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-3 px-8 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer"
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
            const id = selectedReaderBook.id;
            setSelectedReaderBook(null);
            navigate(`/books/${id}/chat`);
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

// ─── Sub-component: Giao diện giả lập đọc sách E-book cao cấp ─────────────────
function BookReaderModal({ book, onClose, onAiConsult }) {
  const [fontSize, setFontSize] = useState(14); // default 14px
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
      bg: 'bg-[#faf8f5] text-stone-800 border-stone-200',
      panel: 'bg-[#f4effa] text-stone-700 border-stone-200',
      menuBg: 'bg-[#faf8f5]',
      activeTab: 'bg-[#e9e3d5] border-[#2C4A3B] text-stone-900',
      tab: 'hover:bg-[#f0ece7] text-stone-600',
    },
    dark: {
      bg: 'bg-[#181818] text-stone-300 border-stone-800',
      panel: 'bg-[#222222] text-stone-400 border-stone-800',
      menuBg: 'bg-[#181818]',
      activeTab: 'bg-[#333333] border-[#2C4A3B] text-white',
      tab: 'hover:bg-[#282828] text-stone-500',
    },
    white: {
      bg: 'bg-white text-stone-900 border-stone-100',
      panel: 'bg-[#f8f9fa] text-stone-600 border-stone-100',
      menuBg: 'bg-white',
      activeTab: 'bg-[#f1f3f5] border-[#2C4A3B] text-stone-900',
      tab: 'hover:bg-[#f8f9fa] text-stone-500',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white border border-divider w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden rounded-none animate-fadeIn">
        
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 border-b border-divider bg-[#faf8f5] flex-shrink-0 gap-3 w-full">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold border border-divider px-2 py-0.5 bg-white uppercase tracking-wider text-ink-light">E-Reader</span>
            <h4 className="text-sm font-serif font-semibold text-ink line-clamp-1">
              {book.title} — {book.author || 'Tác giả'}
            </h4>
          </div>

          {/* Reader Preferences Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Font size control */}
            <div className="flex items-center border border-divider bg-white">
              <button 
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                className="px-2.5 py-1 border-r border-divider hover:bg-[#f0ece7] font-bold text-ink cursor-pointer"
                title="Giảm cỡ chữ"
              >
                A-
              </button>
              <span className="px-2 py-1 font-mono text-[10px] text-ink-light bg-stone-50 select-none">
                {fontSize}px
              </span>
              <button 
                onClick={() => setFontSize(Math.min(22, fontSize + 1))}
                className="px-2.5 py-1 border-l border-divider hover:bg-[#f0ece7] font-bold text-ink cursor-pointer"
                title="Tăng cỡ chữ"
              >
                A+
              </button>
            </div>

            {/* Theme switcher */}
            <div className="flex border border-divider bg-white p-0.5 gap-0.5">
              <button 
                onClick={() => setTheme('warm')}
                className={`w-6 h-6 rounded-none bg-[#faf8f5] border ${theme === 'warm' ? 'border-[#2C4A3B]' : 'border-transparent'} cursor-pointer`}
                title="Nền giấy ấm"
              />
              <button 
                onClick={() => setTheme('white')}
                className={`w-6 h-6 rounded-none bg-white border ${theme === 'white' ? 'border-[#2C4A3B]' : 'border-stone-200'} cursor-pointer`}
                title="Nền sáng"
              />
              <button 
                onClick={() => setTheme('dark')}
                className={`w-6 h-6 rounded-none bg-[#181818] border ${theme === 'dark' ? 'border-[#2C4A3B]' : 'border-transparent'} cursor-pointer`}
                title="Nền tối"
              />
            </div>

            <button 
              onClick={onClose} 
              className="text-ink-light hover:text-ink transition-colors p-1 cursor-pointer ml-3 bg-transparent border-0"
              title="Đóng trình đọc"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Reader Layout Splitter */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Table of Contents */}
          <div className={`w-60 flex-shrink-0 border-r ${themeStyles.bg} overflow-y-auto hidden md:flex flex-col p-4 space-y-4`}>
            <h5 className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-2">Mục lục sách</h5>
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map(ch => (
                <button
                  key={ch}
                  onClick={() => setActiveChapter(ch)}
                  className={`w-full text-left py-2 px-3 text-xs font-medium border-l-2 transition-all cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
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
            <div className="px-8 py-3 border-b border-divider/20 flex justify-between items-center text-[10px] uppercase font-mono tracking-wider opacity-60">
              <span>{mockChaptersContent.title}</span>
              <span>Đã hoàn thành {progress}%</span>
            </div>

            {/* Simulated Paper Book Page Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-8 md:p-14 font-serif leading-relaxed max-w-3xl mx-auto w-full transition-all duration-150">
              <h2 className="text-xl md:text-2xl font-bold mb-6 border-b border-divider/10 pb-4">
                {mockChaptersContent.title}
              </h2>
              <div 
                style={{ fontSize: `${fontSize}px` }}
                className="space-y-6 text-justify whitespace-pre-line"
              >
                {mockChaptersContent.content}
              </div>
            </div>

            {/* Reading progress bar */}
            <div className="h-1 w-full bg-stone-200/30 flex-shrink-0">
              <div 
                className="h-full bg-[#2C4A3B] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer actions with RAG AI Consulting trigger */}
        <div className="bg-[#faf8f5] px-6 py-4 border-t border-divider flex flex-col sm:flex-row justify-between items-center flex-shrink-0 gap-3">
          <div className="text-xs text-ink-light italic">
            Phiên đọc sách điện tử được bảo mật và phân phối bởi thư viện số thông minh.
          </div>
          <div className="flex gap-2">
            {book.rag_indexed_at && (
              <button
                onClick={onAiConsult}
                className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-2 px-5 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8.5 12h7m-7 3h4m3.5-9a9 9 0 11-12.2 12.2L3 21l4.8-1.3A9 9 0 0118.5 6z" />
                </svg>
                Hỏi đáp trợ lý AI
              </button>
            )}
            <button
              onClick={onClose}
              className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-2 px-5 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer bg-white"
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
    mutationFn: (payload) => api.post(`/books/${book.id}/reviews`, payload),
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
    if (!comment || comment.trim().length === 0) {
      toast.error('Vui lòng viết bình luận nhận xét của bạn!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (comment.trim().length > 1000) {
      toast.error('Nội dung bình luận quá dài! Tối đa 1000 ký tự.', { title: 'Lỗi nhập liệu' });
      return;
    }
    reviewMutation.mutate({ rating, comment: comment.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-divider w-full max-w-md shadow-2xl flex flex-col rounded-none animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider bg-[#faf8f5]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#2C4A3B] font-semibold mb-0.5">Đánh giá tác phẩm</p>
            <h4 className="text-sm font-serif font-semibold text-ink leading-tight">
              {book.title}
            </h4>
          </div>
          <button onClick={onClose} className="text-ink-light hover:text-ink transition-colors p-1 cursor-pointer bg-transparent border-0">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Star selector */}
          <div className="text-center space-y-2">
            <span className="block text-xs uppercase tracking-wider text-ink-light font-bold">
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
            <p className="text-xs text-[#2C4A3B] font-semibold tracking-wider uppercase pt-1">
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
            <label className="block text-xs uppercase tracking-wider text-ink-light font-bold">
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
              className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-2 px-4 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer bg-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-2 px-5 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            >
              {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
