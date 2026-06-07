import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/image';
import { 
  ArrowLeft, 
  Sparkles, 
  Send, 
  BookOpen, 
  Info, 
  FileText,
  User,
  Bot,
  HelpCircle
} from 'lucide-react';

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      role: 'ASSISTANT',
      content: 'Xin chào! Tôi là Trợ lý AI được huấn luyện trên nội dung chính chủ của cuốn sách này. Bạn có thể hỏi tôi bất kỳ điều gì liên quan đến diễn biến cốt truyện, phân tích nhân vật, triết lý nhân sinh hoặc các câu hỏi học thuật từ sách nhé!',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Gợi ý câu hỏi nhanh (Prompt Suggestions)
  const promptSuggestions = [
    'Tóm tắt nội dung chính của tác phẩm?',
    'Thông điệp cốt lõi tác giả muốn truyền tải là gì?',
    'Phân tích tính cách các nhân vật nổi bật?',
    'Các bài học nhân sinh đắt giá rút ra từ sách?'
  ];

  // Lấy chi tiết sách để hiển thị ở cột bên trái
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const response = await api.get(`/books/${id}`);
      return response.data.data;
    }
  });

  // Fetch danh sách đơn hàng để kiểm tra quyền sở hữu
  const { data: orders, isLoading: ordersLoading } = useQuery({
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
    order.items.some(item => String(item.bookId) === String(book?.id) || String(item.hashId || item.bookId) === String(id))
  ));

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Tự động tải lại lịch sử chat trước đó của người dùng đối với cuốn sách này
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const response = await api.get(`/ai/chats/${id}/history`);
        const history = response.data.data;
        if (Array.isArray(history) && history.length > 0) {
          const mapped = history.map(msg => ({
            role: msg.sender === 'USER' ? 'USER' : 'ASSISTANT',
            content: msg.content
          }));
          setMessages(mapped);
        }
      } catch (err) {
        console.error('Không thể tải lịch sử trò chuyện:', err);
      }
    };
    if (user && id) {
      loadChatHistory();
    }
  }, [id, user]);

  // Hàm xử lý gửi câu hỏi cốt lõi
  const sendQuestion = async (questionText) => {
    if (!questionText.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'USER', content: questionText }]);
    setLoading(true);
    setInput('');

    try {
      const response = await api.post('/ai/ask', {
        bookId: id,
        question: questionText
      });

      const aiResponse = response.data.data; // format chuẩn: { answer: string, references: Array }
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: aiResponse.answer || aiResponse.content || 'Tôi đã tiếp nhận câu hỏi nhưng không tìm thấy câu trả lời phù hợp trong văn bản sách.',
          sources: aiResponse.references || aiResponse.sources || []
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: '❌ Rất tiếc, đã xảy ra lỗi kết nối với máy chủ AI. Vui lòng thử lại sau.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const defaultImage = book 
    ? (book.cover_url ? getImageUrl(book.cover_url) : `https://picsum.photos/seed/${book.id}/300/450`) 
    : '';

  if (!bookLoading && !ordersLoading && !hasAccess) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center flex-grow w-full bg-[#fdfcfa]">
        <div className="bg-white border border-divider rounded-none p-10 shadow-none">
          <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-5 text-lg">🔒</div>
          <h2 className="text-xl font-serif font-bold text-ink uppercase tracking-wide mb-2">Tính năng đang bị khóa</h2>
          <p className="text-stone-500 text-xs mb-8 leading-relaxed font-sans">
            Bạn cần mua cuốn sách <strong className="font-serif text-ink">"{book?.title}"</strong> và đơn hàng phải được giao thành công để có thể trò chuyện với Trợ lý AI.
          </p>
          <button
            onClick={() => navigate(`/books/${id}`)}
            className="inline-block bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-3.5 px-8 rounded-none transition-colors text-xs uppercase tracking-widest font-sans shadow-[0_4px_12px_rgba(44,74,59,0.15)] cursor-pointer"
          >
            Xem chi tiết sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 flex-grow w-full flex flex-col h-[85vh] bg-[#fdfcfa]">
      
      {/* Nút quay lại */}
      <div className="mb-4 flex-shrink-0">
        <button
          onClick={() => navigate(`/books/${id}`)}
          className="text-stone-500 hover:text-[#2C4A3B] transition-colors font-sans text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
        >
          <ArrowLeft size={12} /> Quay lại chi tiết sách
        </button>
      </div>

      {/* Khung chính chia đôi */}
      <div className="flex-1 flex flex-col md:flex-row border border-divider bg-white overflow-hidden min-h-0 rounded-none shadow-sm">
        
        {/* Cột trái: Thông tin cuốn sách (Ẩn trên mobile để tiết kiệm diện tích) */}
        <div className="hidden md:flex md:w-72 border-r border-divider flex-col p-6 bg-[#faf8f5] flex-shrink-0 justify-between">
          <div>
            {bookLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-44 bg-[#f0ece7] border border-divider-lt"></div>
                <div className="h-6 bg-[#f0ece7] w-3/4"></div>
                <div className="h-4 bg-[#f0ece7] w-1/2"></div>
              </div>
            ) : (
              book && (
                <div className="text-center">
                  <div className="w-28 h-40 bg-white border border-stone-200/80 mx-auto mb-5 rounded-none overflow-hidden shadow-md relative">
                    <img
                      src={defaultImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${book.id}/300/450`; }}
                    />
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-r from-black/15 to-transparent z-10" />
                  </div>
                  <h2 className="font-serif font-bold text-base text-ink uppercase tracking-wider line-clamp-2 leading-snug">{book.title}</h2>
                  <p className="text-[10px] text-stone-400 font-sans uppercase tracking-widest mt-1 mb-4 font-bold">Tác giả: {book.author}</p>
                  <span className="border border-stone-200 bg-white text-stone-500 text-[8px] font-sans font-bold px-2.5 py-0.5 uppercase tracking-widest rounded-none">
                    {book.category || 'Văn học'}
                  </span>
                </div>
              )
            )}
          </div>
          
          <div className="text-[9px] text-stone-400 text-center border-t border-stone-200 pt-4 uppercase tracking-widest leading-relaxed font-sans">
            <span className="font-bold text-[#2C4A3B] flex items-center justify-center gap-1 mb-1">
              <Sparkles size={11} /> Công nghệ RAG AI
            </span>
            Trích xuất ngữ cảnh trực tiếp từ các trang sách thật của ấn phẩm số.
          </div>
        </div>

        {/* Cột phải: Giao diện Chat */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          
          {/* Header phòng chat (Cho mobile) */}
          <div className="md:hidden p-4 border-b border-divider bg-[#faf8f5] flex items-center gap-3.5 flex-shrink-0">
            <img src={defaultImage} alt="" className="w-9 h-13 object-cover border border-stone-200 rounded-none shadow-sm aspect-[3/4]" />
            <div>
              <h3 className="font-serif font-bold text-ink text-xs uppercase tracking-wider line-clamp-1 leading-none">{book?.title}</h3>
              <p className="text-[9px] text-stone-400 font-sans uppercase tracking-widest mt-1.5 font-bold leading-none">{book?.author}</p>
            </div>
          </div>

          {/* Vùng hội thoại tin nhắn */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#faf8f5]/40 scrollbar-thin">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'USER';
              return (
                <div key={index} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* AI Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-none border border-[#2C4A3B]/20 bg-[#2C4A3B]/5 flex items-center justify-center flex-shrink-0 text-[#2C4A3B]">
                      <Bot size={15} />
                    </div>
                  )}

                  {/* Tin nhắn bubble */}
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-none p-4 border transition-all ${
                    isUser
                      ? 'bg-[#2C4A3B] text-white border-transparent shadow-sm'
                      : 'bg-white text-ink border-stone-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-line text-xs font-sans">
                      {msg.content}
                    </p>
                    
                    {/* Hiển thị nguồn trích dẫn từ RAG */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-150 text-[10px] text-stone-500 font-sans">
                        <span className="font-bold text-[#2C4A3B] flex items-center gap-1 mb-1.5">
                          <FileText size={11} /> Nguồn đối chiếu từ sách:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {msg.sources.map((source, sIdx) => {
                            const pageNum = source.page || source.page_number || sIdx + 1;
                            const snippet = source.snippet || source.content || 'Trích đoạn tham chiếu...';
                            return (
                              <span 
                                key={sIdx} 
                                className="bg-stone-100 hover:bg-[#2C4A3B]/10 hover:text-[#2C4A3B] text-stone-700 font-bold px-2 py-0.5 border border-stone-200/50 rounded-none transition-colors text-[9px] uppercase tracking-widest cursor-help relative group"
                                title={snippet}
                              >
                                Trang {pageNum}
                                
                                {/* CSS Tooltip popup showing snippet */}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-stone-900 text-stone-100 text-[9px] p-2.5 rounded-none shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 normal-case leading-relaxed font-normal">
                                  {snippet}
                                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900"></span>
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-none border border-stone-300 bg-stone-50 flex items-center justify-center flex-shrink-0 text-stone-600">
                      <User size={14} />
                    </div>
                  )}

                </div>
              );
            })}

            {/* Hiệu ứng loading khi AI đang suy nghĩ */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-none border border-[#2C4A3B]/20 bg-[#2C4A3B]/5 flex items-center justify-center flex-shrink-0 text-[#2C4A3B]">
                  <Bot size={15} />
                </div>
                <div className="bg-white border border-stone-200 rounded-none p-4 max-w-[75%] flex items-center justify-center">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 bg-[#2C4A3B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#2C4A3B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#2C4A3B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Vùng gợi ý câu hỏi nhanh (Prompt Suggestions) */}
          <div className="px-4 py-2 border-t border-divider bg-[#faf8f5]/60 flex-shrink-0 flex items-center gap-2 overflow-x-auto select-none scrollbar-none">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
              <HelpCircle size={11} /> Gợi ý nhanh:
            </span>
            <div className="flex gap-1.5">
              {promptSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendQuestion(suggestion)}
                  disabled={loading}
                  className="bg-white hover:bg-[#2C4A3B]/10 hover:text-[#2C4A3B] border border-stone-200 text-stone-600 disabled:opacity-40 font-semibold px-3 py-1 rounded-none text-[9px] tracking-wide uppercase transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Khung nhập liệu */}
          <form onSubmit={handleFormSubmit} className="border-t border-divider p-4 flex gap-3 bg-white flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? 'Trợ lý AI đang suy nghĩ...' : `Đặt câu hỏi cho Trợ lý AI về tác phẩm "${book?.title || 'này'}"...`}
              disabled={loading}
              className="flex-1 border border-stone-200 rounded-none px-4 py-3 text-xs font-sans focus:outline-none focus:border-[#2C4A3B] focus:ring-1 focus:ring-[#2C4A3B] bg-transparent text-ink disabled:bg-stone-50 transition-all placeholder-stone-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#2C4A3B] hover:bg-[#1e3529] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 uppercase tracking-widest rounded-none transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Send size={12} /> Gửi
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
