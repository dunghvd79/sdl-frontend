import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bell, ArrowLeft, Check, CheckCheck, Clock, Package, Megaphone, User } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch notifications
  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['myNotifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.data;
    },
    enabled: !!user,
    refetchInterval: 15000 // 15s polling to feel real-time
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myNotifications']);
    },
    onError: (err) => {
      console.error('Error marking all as read:', err);
    }
  });

  // Mark specific notification as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myNotifications']);
    },
    onError: (err) => {
      console.error('Error marking notification as read:', err);
    }
  });

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.type === 'ORDER') {
      navigate('/orders');
    } else {
      navigate('/profile');
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 flex-grow w-full flex flex-col justify-center items-center bg-[#faf8f5]">
        <div className="animate-pulse space-y-6 w-full">
          <div className="h-10 bg-stone-200 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-stone-200 rounded w-1/2 mx-auto"></div>
          <div className="space-y-4 mt-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-stone-200 w-full rounded border border-divider"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center flex-grow w-full bg-[#faf8f5] flex flex-col justify-center items-center">
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

  const items = notifications || [];
  const unreadCount = items.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return <Package size={16} className="text-emerald-700" />;
      case 'PROMOTION':
        return <Megaphone size={16} className="text-amber-700" />;
      case 'ACCOUNT':
        return <User size={16} className="text-blue-700" />;
      default:
        return <Bell size={16} className="text-stone-700" />;
    }
  };

  const getBgClass = (type) => {
    switch (type) {
      case 'ORDER':
        return 'bg-emerald-50 border border-emerald-200';
      case 'PROMOTION':
        return 'bg-amber-50 border border-amber-200';
      case 'ACCOUNT':
        return 'bg-blue-50 border border-blue-200';
      default:
        return 'bg-stone-50 border border-stone-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex-grow py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => navigate('/', { state: { scrollTo: 'explore' } })}
          className="group mb-8 flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900 uppercase tracking-widest font-sans font-bold transition-colors border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại Cửa hàng
        </button>

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-stone-200 pb-6 mb-10 gap-4">
          <div className="space-y-2">
            <span className="text-[#2C4A3B] text-[10px] font-sans font-bold tracking-[0.3em] uppercase block">
              Trung tâm cập nhật
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 uppercase tracking-wide flex items-center gap-3">
              Thông báo của tôi
              {unreadCount > 0 && (
                <span className="bg-[#2C4A3B] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} chưa đọc
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center gap-2 border border-[#2C4A3B] text-[#2C4A3B] hover:bg-[#2C4A3B] hover:text-white px-4 py-2 uppercase font-sans font-bold tracking-widest text-[10px] transition-all cursor-pointer bg-transparent"
            >
              <CheckCheck size={14} />
              Đánh dấu đọc tất cả
            </button>
          )}
        </div>

        {/* Notifications List */}
        {items.length === 0 ? (
          <div className="border border-stone-200 bg-white p-16 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full border border-stone-100 flex items-center justify-center bg-stone-50 text-stone-400">
              <Bell size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold uppercase tracking-wider text-stone-800">
                Không có thông báo
              </h3>
              <p className="text-stone-500 font-sans text-xs max-w-sm mx-auto leading-relaxed">
                Bạn chưa nhận được thông báo nào từ hệ thống. Các cập nhật về đơn hàng hoặc khuyến mãi sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 divide-y divide-stone-100 shadow-sm">
            {items.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50 transition-colors relative ${
                  !notif.is_read ? 'bg-[#faf8f5]/60' : 'bg-white'
                }`}
              >
                {/* Unread indicator bar */}
                {!notif.is_read && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#2C4A3B]" />
                )}

                <div className="flex gap-4 items-start min-w-0 flex-1">
                  {/* Category icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgClass(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-sm text-stone-900 leading-tight ${!notif.is_read ? 'font-bold' : 'font-semibold'}`}>
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <span className="bg-[#2C4A3B]/10 text-[#2C4A3B] text-[8px] font-sans font-bold px-1.5 py-0.5 uppercase tracking-wide">
                          Mới
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans pr-4">
                      {notif.content}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-sans">
                      <Clock size={10} />
                      <span>
                        {new Date(notif.created_at).toLocaleDateString('vi-VN')} {new Date(notif.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mark as read button */}
                {!notif.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate(notif.id);
                    }}
                    className="flex-shrink-0 border border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-900 p-2 transition-all cursor-pointer bg-white"
                    title="Đánh dấu đã đọc"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
