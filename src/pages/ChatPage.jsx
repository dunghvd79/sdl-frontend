import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../services/image';

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      role: 'ASSISTANT',
      content: 'Xin chào! Tôi là Trợ lý AI của cuốn sách này. Bạn có thể hỏi tôi bất kỳ điều gì liên quan đến nội dung, nhân vật, hoặc kiến thức trong sách!',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
    order.items.some(item => String(item.bookId) === String(id))
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

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Thêm tin nhắn của User vào danh sách hiển thị
    setMessages((prev) => [...prev, { role: 'USER', content: userMessage }]);
    setLoading(true);

    try {
      // Gửi request lên FastAPI / Node.js Backend AI
      const response = await api.post('/ai/ask', {
        bookId: id,
        question: userMessage
      });

      const aiResponse = response.data.data; // format chuẩn: { answer: string, references: Array }
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: aiResponse.answer || aiResponse.content || 'Tôi đã tiếp nhận câu hỏi nhưng không tìm thấy câu trả lời phù hợp.',
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

  const defaultImage = book 
    ? (book.cover_url ? getImageUrl(book.cover_url) : `https://picsum.photos/seed/${book.id + 10}/300/450`) 
    : '';

  if (!bookLoading && !ordersLoading && !hasAccess) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center flex-grow w-full">
        <div className="bg-white border border-divider rounded-none p-10 shadow-none">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-serif font-medium text-ink mb-2">TÍNH NĂNG ĐANG BỊ KHÓA</h2>
          <p className="text-ink-60 text-sm mb-8 leading-relaxed font-sans">
            Bạn cần mua cuốn sách <strong className="font-serif text-ink">"{book?.title}"</strong> và đơn hàng phải được giao thành công để có thể trò chuyện với Trợ lý AI.
          </p>
          <button
            onClick={() => navigate(`/books/${id}`)}
            className="inline-block bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-3 px-8 rounded-none transition-colors text-xs uppercase tracking-wider font-sans font-bold"
          >
            Xem chi tiết sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 flex-grow w-full flex flex-col h-screen">
      {/* Nút quay lại */}
      <div className="mb-4 flex-shrink-0">
        <button
          onClick={() => navigate(`/books/${id}`)}
          className="text-ink-60 hover:text-[#2C4A3B] transition-colors font-sans text-xs uppercase tracking-widest font-bold flex items-center gap-1.5 cursor-pointer"
        >
          ← Quay lại chi tiết sách
        </button>
      </div>

      {/* Khung chính chia đôi */}
      <div className="flex-1 flex flex-col md:flex-row border border-divider bg-white overflow-hidden min-h-0 rounded-none">
        
        {/* Cột trái: Thông tin cuốn sách (Ẩn trên mobile để tiết kiệm diện tích) */}
        <div className="hidden md:flex md:w-80 border-r border-divider flex-col p-6 bg-[#fcfbf9] flex-shrink-0 justify-between">
          <div>
            {bookLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-[#f0ece7] rounded-none"></div>
                <div className="h-6 bg-[#f0ece7] rounded-none w-3/4"></div>
                <div className="h-4 bg-[#f0ece7] rounded-none w-1/2"></div>
              </div>
            ) : (
              book && (
                <div className="text-center">
                  <img
                    src={defaultImage}
                    alt={book.title}
                    className="w-36 h-52 object-cover border border-divider-lt mx-auto mb-5 rounded-none aspect-[3/4]"
                  />
                  <h2 className="font-serif font-bold text-lg text-ink uppercase tracking-wide line-clamp-2">{book.title}</h2>
                  <p className="text-ink-60 text-xs font-sans uppercase tracking-widest mt-2 mb-4">Tác giả: {book.author}</p>
                  <span className="border border-divider text-ink-60 text-[10px] font-sans font-bold px-3 py-1 uppercase tracking-wider rounded-none">
                    {book.category || 'Văn học'}
                  </span>
                </div>
              )
            )}
          </div>
          
          <div className="text-[10px] text-stone-400 text-center border-t border-divider-lt pt-4 uppercase tracking-wider leading-relaxed">
            Hệ thống RAG tự động đọc, phân tích và trích xuất nguồn từ các trang sách thật.
          </div>
        </div>

        {/* Cột phải: Giao diện Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Header phòng chat (Cho mobile) */}
          <div className="md:hidden p-4 border-b border-divider bg-[#fcfbf9] flex items-center gap-3">
            <img src={defaultImage} alt="" className="w-10 h-14 object-cover border border-divider-lt rounded-none aspect-[3/4]" />
            <div>
              <h3 className="font-serif font-bold text-ink text-sm uppercase tracking-wide line-clamp-1">{book?.title}</h3>
              <p className="text-xs text-ink-60 font-sans uppercase tracking-widest mt-1">{book?.author}</p>
            </div>
          </div>

          {/* Vùng tin nhắn */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-surface-warm">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'USER';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-none p-4 border border-divider-lt ${
                    isUser
                      ? 'bg-[#2C4A3B] text-white border-none'
                      : 'bg-white text-ink'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-line text-sm">
                      {msg.content}
                    </p>
                    
                    {/* Hiển thị nguồn trích dẫn từ RAG */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-divider-lt text-xs text-ink-60">
                        <span className="font-semibold block mb-1">📍 Nguồn trích dẫn:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {msg.sources.map((source, sIdx) => (
                            <span 
                              key={sIdx} 
                              className="bg-[#f0ece7] hover:bg-[#e8e4db] text-ink font-semibold px-2 py-0.5 rounded-none transition-colors text-[10px] uppercase tracking-wider"
                              title={source.snippet || 'Trích đoạn từ sách'}
                            >
                              Trang {source.page || source.page_number || sIdx + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Hiệu ứng loading khi AI đang suy nghĩ */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-divider-lt rounded-none p-4 max-w-[75%]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-[#2C4A3B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#2C4A3B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-[#2C4A3B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Khung nhập liệu */}
          <form onSubmit={handleSend} className="border-t border-divider p-4 flex gap-3 bg-white flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Hỏi tôi về sách "${book?.title || 'này'}"...`}
              disabled={loading}
              className="flex-1 border border-divider rounded-none px-4 py-3 text-sm focus:border-ink focus:outline-none bg-transparent text-ink disabled:bg-stone-50"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-ink hover:bg-[#2C4A3B] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-sans text-xs font-bold px-6 py-3 uppercase tracking-widest rounded-none transition-colors"
            >
              Gửi
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
