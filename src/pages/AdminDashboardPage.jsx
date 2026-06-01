import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { getImageUrl } from '../services/image';

// ─── Sub-component: Tab Quản lý Sách ──────────────────────────────────────
function BookManagerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', description: '', price: '', cover_url: '', status: 'PUBLISHED', categoryIds: [], is_featured: false, is_bestseller: false, display_order: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // States cho tìm kiếm và bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh quá lớn! Tối đa 5MB.', { title: 'Lỗi tải ảnh' });
      return;
    }

    const formData = new FormData();
    formData.append('cover', file);

    setUploadingCover(true);
    try {
      const response = await api.post('/upload/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { url } = response.data.data;
      setForm(f => ({ ...f, cover_url: url }));
      toast.success('Tải ảnh bìa lên thành công!', { title: 'Thành công' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Có lỗi xảy ra khi tải ảnh lên';
      toast.error(errMsg, { title: 'Lỗi tải ảnh' });
    } finally {
      setUploadingCover(false);
    }
  };

  // Fetch danh sách sách (adminMode=true → lấy cả DRAFT và HIDDEN)
  const { data, isLoading } = useQuery({
    queryKey: ['adminBooks'],
    queryFn: () => api.get('/books?limit=200&adminMode=true').then(r => r.data.data?.books || r.data.data || [])
  });
  const books = Array.isArray(data) ? data : [];

  // Lọc danh sách sách
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.isbn && book.isbn.includes(searchTerm));

    const matchesStatus = 
      statusFilter === 'ALL' || 
      book.status === statusFilter;

    const matchesCategory = 
      categoryFilter === 'ALL' || 
      book.categories?.some(c => c.id === Number(categoryFilter));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Fetch danh sách danh mục (thể loại)
  const { data: categoriesData } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => api.get('/categories').then(r => r.data.data || [])
  });
  const categories = categoriesData || [];

  const openAddModal = () => {
    setEditBook(null);
    setForm({ title: '', author: '', isbn: '', description: '', price: '', cover_url: '', status: 'PUBLISHED', categoryIds: [], is_featured: false, is_bestseller: false, display_order: 0 });
    setShowUrlInput(false);
    setShowModal(true);
  };

  const openEditModal = (book) => {
    setEditBook(book);
    setForm({ 
      title: book.title, 
      author: book.author, 
      isbn: book.isbn || '', 
      description: book.description || '', 
      price: book.price,
      cover_url: book.cover_url || '',
      status: book.status || 'PUBLISHED',
      categoryIds: book.categories?.map(c => c.id) || [],
      is_featured: book.is_featured || false,
      is_bestseller: book.is_bestseller || false,
      display_order: book.display_order !== undefined ? book.display_order : 0
    });
    // Hiển thị input URL nếu ảnh hiện tại là url bên ngoài (bắt đầu bằng http)
    setShowUrlInput(!!book.cover_url && (book.cover_url.startsWith('http://') || book.cover_url.startsWith('https://')));
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, price: Number(form.price), categories: form.categoryIds };
      if (editBook) return api.put(`/books/${editBook.id}`, payload);
      return api.post('/books', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBooks']);
      setShowModal(false);
      toast.success(editBook ? `Đã cập nhật sách thành công!` : 'Đã thêm sách mới thành công!', { title: editBook ? 'Cập nhật' : 'Thêm sách' });
    },
    onError: (err) => toast.error(err.response?.data?.error || err.message, { title: 'Lỗi lưu sách' })
  });

  const handleSaveBook = () => {
    // 1. Kiểm tra Tên sách
    if (!form.title || !form.title.trim()) {
      toast.error('Tên sách không được để trống!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.title.length > 255) {
      toast.error('Tên sách quá dài! Tối đa 255 ký tự.', { title: 'Lỗi nhập liệu' });
      return;
    }

    // 2. Kiểm tra Tác giả
    if (!form.author || !form.author.trim()) {
      toast.error('Tác giả không được để trống!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.author.length > 255) {
      toast.error('Tên tác giả quá dài! Tối đa 255 ký tự.', { title: 'Lỗi nhập liệu' });
      return;
    }

    // 3. Kiểm tra Giá bán
    if (form.price === undefined || form.price === null || form.price === '') {
      toast.error('Giá bán không được để trống!', { title: 'Lỗi nhập liệu' });
      return;
    }
    const numPrice = Number(form.price);
    if (isNaN(numPrice)) {
      toast.error('Giá bán phải là số hợp lệ!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (numPrice < 0) {
      toast.error('Giá bán không hợp lệ! Giá sách phải từ 0 đ trở lên.', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (numPrice > 99999999.99) {
      toast.error('Giá bán vượt quá giới hạn hệ thống! Tối đa 99.999.999 đ.', { title: 'Lỗi nhập liệu' });
      return;
    }

    // 4. Kiểm tra Mã ISBN
    if (form.isbn) {
      if (form.isbn.length > 50) {
        toast.error('Mã ISBN quá dài! Tối đa 50 ký tự.', { title: 'Lỗi nhập liệu' });
        return;
      }
      const isbnRegex = /^[0-9\-]+$/;
      if (!isbnRegex.test(form.isbn)) {
        toast.error('Mã ISBN không hợp lệ! Vui lòng chỉ nhập số và dấu gạch ngang.', { title: 'Lỗi nhập liệu' });
        return;
      }
    }

    // 5. Kiểm tra Mô tả
    if (form.description && form.description.length > 5000) {
      toast.error('Mô tả sách quá dài! Tối đa 5000 ký tự.', { title: 'Lỗi nhập liệu' });
      return;
    }

    // Nếu hợp lệ, gọi saveMutation
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBooks']);
      toast.success('Đã xóa sách thành công!', { title: 'Đã xóa' });
      setConfirmDialog({ isOpen: false });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi xóa sách' });
      setConfirmDialog({ isOpen: false });
    }
  });

  const handleDelete = (book) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa sách',
      message: `Bạn chắc chắn muốn xóa "${book.title}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa sách',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(book.id),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-serif font-semibold text-ink">Quản lý sách</h2>
        <button
          onClick={openAddModal}
          className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-2 px-5 rounded-none transition-colors text-xs uppercase tracking-wider cursor-pointer"
        >
          + Thêm Sách Mới
        </button>
      </div>

      {/* Bảng thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#faf8f5] border border-divider p-4 flex flex-col rounded-none shadow-none">
          <span className="text-[9px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Tổng đầu sách</span>
          <span className="text-xl font-serif font-bold text-ink">{books.length} cuốn</span>
        </div>
        <div className="bg-[#faf8f5] border border-divider p-4 flex flex-col rounded-none shadow-none">
          <span className="text-[9px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Đang công khai</span>
          <span className="text-xl font-serif font-bold text-green-700">{books.filter(b => b.status === 'PUBLISHED').length} cuốn</span>
        </div>
        <div className="bg-[#faf8f5] border border-divider p-4 flex flex-col rounded-none shadow-none">
          <span className="text-[9px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Bản nháp & Ẩn</span>
          <span className="text-xl font-serif font-bold text-amber-700">{books.filter(b => b.status === 'DRAFT' || b.status === 'HIDDEN').length} cuốn</span>
        </div>
      </div>

      {/* Thanh tìm kiếm & bộ lọc */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-[#faf8f5]/50 border border-divider p-4 rounded-none">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Tìm theo tên sách, tác giả, hoặc mã ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-3 py-2 border border-divider rounded-none bg-white text-xs text-ink focus:outline-none focus:border-[#2C4A3B] transition-colors placeholder:text-stone-400"
          />
        </div>
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-divider rounded-none bg-white text-xs text-ink font-semibold focus:outline-none focus:border-[#2C4A3B] transition-colors cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PUBLISHED">Công khai</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="HIDDEN">Đã ẩn</option>
          </select>
        </div>
        <div className="w-full md:w-52">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-divider rounded-none bg-white text-xs text-ink font-semibold focus:outline-none focus:border-[#2C4A3B] transition-colors cursor-pointer"
          >
            <option value="ALL">Tất cả thể loại</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-divider shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="text-left py-3 px-4 w-16">ID</th>
                <th className="text-left py-3 px-4 w-16">Bìa</th>
                <th className="text-left py-3 px-4">Tên Sách</th>
                <th className="text-left py-3 px-4">Tác Giả</th>
                <th className="text-center py-3 px-4 w-28">Trạng thái</th>
                <th className="text-right py-3 px-4 w-32">Giá</th>
                <th className="text-center py-3 px-4 w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {filteredBooks.map(book => {
                const statusBadge = {
                  PUBLISHED: 'border-green-200 text-green-700 bg-green-50/50',
                  DRAFT:     'border-amber-200 text-amber-700 bg-amber-50/50',
                  HIDDEN:    'border-red-200 text-red-600 bg-red-50/50',
                }[book.status] || 'border-divider text-ink-light bg-surface-subtle';
                const statusLabel = { PUBLISHED: 'Công khai', DRAFT: 'Bản nháp', HIDDEN: 'Ẩn' }[book.status] || book.status;
                const bookCover = book.cover_url ? getImageUrl(book.cover_url) : 'https://cdn-icons-png.flaticon.com/512/330/330732.png';
                return (
                <tr key={book.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="py-3 px-4 text-ink-light font-mono text-xs">#{book.id}</td>
                  <td className="py-2 px-4">
                    <div className="w-8 aspect-[3/4] border border-divider bg-white flex items-center justify-center overflow-hidden">
                      <img src={bookCover} alt="Bìa" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="py-3 px-4 font-serif font-medium text-ink">{book.title}</td>
                  <td className="py-3 px-4 text-ink-light">{book.author}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 border rounded-none uppercase tracking-wider ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#2C4A3B]">
                    {Number(book.price).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(book)}
                        className="border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-xs transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(book)}
                        disabled={deleteMutation.isPending}
                        className="border border-red-200 hover:bg-red-50 text-red-700 font-medium py-1 px-3 rounded-none text-xs transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {filteredBooks.length === 0 && (
            <p className="text-center py-12 text-ink-light italic">Không tìm thấy sách phù hợp.</p>
          )}
        </div>
      )}

      {/* Modal Thêm/Sửa Sách – Thiết kế 2 cột rộng */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-none border border-divider w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-divider bg-[#faf8f5] flex-shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-light font-semibold mb-0.5">
                  {editBook ? 'CHỈNH SỬA ẤN PHẨM' : 'THÊM ẤN PHẨM MỚI'}
                </p>
                <h3 className="text-xl font-serif font-semibold text-ink leading-tight">
                  {editBook ? editBook.title : 'Nhập thông tin sách'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-ink-light hover:text-ink transition-colors p-1 ml-4">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Body: 2 cột */}
            <div className="flex flex-1 overflow-hidden">

              {/* Cột Trái: Ảnh bìa + Trạng thái + Thể loại */}
              <div className="w-60 flex-shrink-0 border-r border-divider bg-[#faf8f5] flex flex-col overflow-y-auto">

                {/* Cover Preview */}
                <div className="p-5 border-b border-divider">
                  <p className="text-[10px] uppercase tracking-wider text-ink-light font-semibold mb-3">Ảnh bìa sách</p>
                  
                  {/* Aspect ratio frame with hover action overlay */}
                  <div className="w-full aspect-[3/4] border border-divider bg-white flex items-center justify-center overflow-hidden mb-3 relative group">
                    {form.cover_url ? (
                      <>
                        <img src={getImageUrl(form.cover_url)} alt="Ảnh bìa" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cover_url: '' }))}
                            className="bg-red-600 text-white text-[10px] uppercase tracking-wider font-bold py-1.5 px-3 hover:bg-red-700 transition-colors"
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-ink-light/30 gap-2">
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 21V9"/></svg>
                        <span className="text-[9px] text-center px-2 leading-relaxed">Chưa có ảnh bìa</span>
                      </div>
                    )}
                    
                    {/* Loading spinner during upload */}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center text-[#2C4A3B] gap-2">
                        <svg className="animate-spin" width="20" height="20" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-[9px] uppercase tracking-wider font-bold">Đang tải lên...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* File Upload Trigger */}
                  <div className="space-y-2">
                    <label className="block w-full border border-dashed border-divider hover:border-[#2C4A3B] text-center py-3 cursor-pointer transition-colors bg-white">
                      <span className="text-xs text-ink-light font-medium block">📁 Tải ảnh từ máy tính</span>
                      <span className="text-[9px] text-ink-light/40 block mt-0.5">Hỗ trợ JPG, PNG, WEBP tối đa 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={uploadingCover}
                        className="hidden"
                      />
                    </label>
                    
                    {/* Toggle Paste URL */}
                    {showUrlInput ? (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-ink-light/60 uppercase font-semibold">Nhập URL trực tiếp</span>
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className="text-[9px] text-[#2C4A3B] hover:underline"
                          >
                            Ẩn
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Dán URL ảnh bìa..."
                          value={form.cover_url}
                          onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
                          className="w-full border border-divider rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink placeholder:text-ink-light/40"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(true)}
                        className="text-[10px] text-[#2C4A3B] hover:underline font-semibold block text-center w-full mt-1"
                      >
                        🔗 Hoặc dán URL ảnh bìa
                      </button>
                    )}
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="p-5 border-b border-divider">
                  <p className="text-[10px] uppercase tracking-wider text-ink-light font-semibold mb-3">Trạng thái</p>
                  <div className="space-y-1.5">
                    {[
                      { val: 'PUBLISHED', label: 'Công khai', sub: 'Hiển thị Storefront', dot: 'bg-green-500' },
                      { val: 'DRAFT',     label: 'Bản nháp',  sub: 'Chưa xuất bản',       dot: 'bg-amber-400' },
                      { val: 'HIDDEN',    label: 'Tạm ẩn',    sub: 'Ẩn khỏi Storefront',  dot: 'bg-red-500'   },
                    ].map(opt => (
                      <label key={opt.val} className={`flex items-center gap-2.5 p-2.5 border cursor-pointer transition-all ${form.status === opt.val ? 'border-[#2C4A3B] bg-[#fdf9f5]' : 'border-divider bg-white hover:bg-[#faf8f5]'}`}>
                        <input type="radio" name="bookStatus" value={opt.val} checked={form.status === opt.val} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="sr-only" />
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-ink">{opt.label}</div>
                          <div className="text-[9px] text-ink-light leading-tight">{opt.sub}</div>
                        </div>
                        {form.status === opt.val && (
                          <svg className="text-[#2C4A3B] flex-shrink-0" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tùy chọn hiển thị (Nổi bật & Thứ tự) */}
                <div className="p-5 border-b border-divider space-y-4">
                  <p className="text-[10px] uppercase tracking-wider text-ink-light font-semibold">Tùy chọn hiển thị</p>
                  <label className={`flex items-center gap-2.5 p-2.5 border cursor-pointer transition-all ${form.is_featured ? 'border-[#2C4A3B] bg-[#fdf9f5]' : 'border-divider bg-white hover:bg-[#faf8f5]'}`}>
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded-none accent-[#2C4A3B] border-divider cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-ink">Nổi bật (Editor's Pick)</div>
                      <div className="text-[9px] text-ink-light leading-tight">Đưa lên kệ sách nổi bật trang chủ</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-2.5 border cursor-pointer transition-all ${form.is_bestseller ? 'border-[#2C4A3B] bg-[#fdf9f5]' : 'border-divider bg-white hover:bg-[#faf8f5]'}`}>
                    <input
                      type="checkbox"
                      checked={form.is_bestseller}
                      onChange={e => setForm(f => ({ ...f, is_bestseller: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded-none accent-[#2C4A3B] border-divider cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-ink">Bán chạy (Best Seller)</div>
                      <div className="text-[9px] text-ink-light leading-tight">Đóng nhãn BESTSELLER nổi bật trên ảnh bìa sách</div>
                    </div>
                  </label>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-semibold">Thứ tự ưu tiên (Trang chủ)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.display_order}
                      onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-divider rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink"
                      placeholder="Mặc định: 0"
                    />
                    <span className="text-[9px] text-ink-light/70 block mt-1 leading-tight">* Số càng lớn càng ưu tiên xếp lên đầu.</span>
                  </div>
                </div>

                {/* Thể loại */}
                <div className="p-5 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-ink-light font-semibold mb-3">Thể loại</p>
                  <div className="space-y-1">
                    {categories.map(cat => (
                      <label key={cat.id} className={`flex items-center gap-2.5 px-3 py-2 border cursor-pointer transition-all ${form.categoryIds.includes(cat.id) ? 'border-[#2C4A3B] bg-[#fdf9f5]' : 'border-divider bg-white hover:bg-[#faf8f5]'}`}>
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(cat.id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setForm(f => ({ ...f, categoryIds: checked ? [...f.categoryIds, cat.id] : f.categoryIds.filter(id => id !== cat.id) }));
                          }}
                          className="w-3 h-3 accent-[#2C4A3B]"
                        />
                        <span className="text-xs text-ink">{cat.name}</span>
                        {form.categoryIds.includes(cat.id) && (
                          <svg className="ml-auto text-[#2C4A3B] flex-shrink-0" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                        )}
                      </label>
                    ))}
                    {categories.length === 0 && <span className="text-xs text-ink-light italic">Chưa có thể loại nào.</span>}
                  </div>
                </div>
              </div>

              {/* Cột Phải: Thông tin sách */}
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="p-8 flex-1 space-y-7">

                  {/* Nhóm 1: Thông tin cơ bản */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-5 h-5 rounded-full bg-[#2C4A3B] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span className="text-[10px] uppercase tracking-widest text-ink-light font-semibold">Thông tin cơ bản</span>
                      <div className="flex-1 h-px bg-divider" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-semibold">
                          Tên sách <span className="text-[#2C4A3B]">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Mắt Biếc"
                          value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full border border-divider rounded-none px-4 py-3 text-base font-serif focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink placeholder:text-ink-light/40"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-semibold">
                            Tác giả <span className="text-[#2C4A3B]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Nguyễn Nhật Ánh"
                            value={form.author}
                            onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                            className="w-full border border-divider rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink placeholder:text-ink-light/40"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-semibold">Mã ISBN</label>
                          <input
                            type="text"
                            placeholder="978-x-xxx-xxxxx-x"
                            value={form.isbn}
                            onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))}
                            className="w-full border border-divider rounded-none px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink placeholder:text-ink-light/40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nhóm 2: Định giá */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-5 h-5 rounded-full bg-[#2C4A3B] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span className="text-[10px] uppercase tracking-widest text-ink-light font-semibold">Định giá</span>
                      <div className="flex-1 h-px bg-divider" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-ink-light mb-1.5 font-semibold">
                        Giá bán <span className="text-[#2C4A3B]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="85000"
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          className="w-full border border-divider rounded-none pl-4 pr-20 py-3 text-sm font-mono focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink"
                        />
                        <div className="absolute right-0 inset-y-0 flex items-center px-4 border-l border-divider bg-[#faf8f5] pointer-events-none">
                          <span className="text-xs font-semibold text-ink-light tracking-wider">VNĐ</span>
                        </div>
                      </div>
                      {form.price && Number(form.price) > 0 && (
                        <p className="mt-1.5 text-xs text-[#2C4A3B] font-medium font-serif italic">
                          {Number(form.price).toLocaleString('vi-VN')} đồng
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nhóm 3: Mô tả */}
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-5 h-5 rounded-full bg-[#2C4A3B] text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span className="text-[10px] uppercase tracking-widest text-ink-light font-semibold">Mô tả nội dung</span>
                      <div className="flex-1 h-px bg-divider" />
                    </div>
                    <textarea
                      rows={6}
                      placeholder="Giới thiệu ngắn gọn về nội dung cuốn sách. Đây là đoạn mô tả đầu tiên khách hàng nhìn thấy trên trang sản phẩm..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full border border-divider rounded-none px-4 py-3 text-sm focus:outline-none focus:border-[#2C4A3B] transition-colors bg-white text-ink resize-none leading-relaxed placeholder:text-ink-light/40"
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-ink-light">{(form.description || '').length} ký tự</span>
                    </div>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="px-8 py-5 border-t border-divider bg-[#faf8f5] flex items-center justify-between gap-4 flex-shrink-0">
                  <p className="text-[10px] text-ink-light"><span className="text-[#2C4A3B]">*</span> Trường bắt buộc</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-white hover:bg-[#f0ece7] text-ink font-semibold py-2.5 px-6 rounded-none transition-colors text-xs uppercase tracking-wider border border-divider"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleSaveBook}
                      disabled={saveMutation.isPending || !form.title || !form.author || !form.price}
                      className="bg-[#2C4A3B] hover:bg-[#1e3529] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-8 rounded-none transition-all text-xs uppercase tracking-wider flex items-center gap-2"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          Đang lưu...
                        </>
                      ) : editBook ? '✓  Lưu thay đổi' : '+  Thêm sách'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại xác nhận xóa */}
      <ConfirmDialog
        {...confirmDialog}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
}

// ─── Sub-component: Tab Quản lý Kho ──────────────────────────────────────
function InventoryManagerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // State bộ lọc và tìm kiếm tồn kho
  const [searchTermStock, setSearchTermStock] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, OUT_OF_STOCK, LOW_STOCK, SAFE
  
  // State bộ lọc lịch sử giao dịch
  const [txTypeFilter, setTxTypeFilter] = useState('ALL'); // ALL, STOCK_IN, STOCK_OUT, ADJUSTMENT, RETURN
  const [txTimeframe, setTxTimeframe] = useState('ALL'); // ALL, TODAY, 7DAYS, 30DAYS

  // State Modal Phiếu Nhập Kho
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedBookForStock, setSelectedBookForStock] = useState(null);
  const [stockChangeType, setStockChangeType] = useState('STOCK_IN'); // STOCK_IN, ADJUSTMENT
  const [stockChangeQty, setStockChangeQty] = useState('');
  const [stockChangeReason, setStockChangeReason] = useState('');
  const [isSavingStock, setIsSavingStock] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminInventory'],
    queryFn: () => api.get('/inventory').then(r => r.data.data || [])
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['adminInventoryTransactions'],
    queryFn: () => api.get('/inventory/transactions').then(r => r.data.data || [])
  });

  const inventory = data || [];
  const transactions = txData || [];

  // Lọc sách tồn kho
  const filteredInventory = inventory.filter(item => {
    // 1. Tìm kiếm từ khóa
    const matchSearch = 
      item.title?.toLowerCase().includes(searchTermStock.toLowerCase()) ||
      item.author?.toLowerCase().includes(searchTermStock.toLowerCase());
      
    // 2. Lọc tồn kho
    let matchStock = true;
    if (stockFilter === 'OUT_OF_STOCK') {
      matchStock = item.available_qty <= 0;
    } else if (stockFilter === 'LOW_STOCK') {
      matchStock = item.available_qty > 0 && item.available_qty <= 5;
    } else if (stockFilter === 'SAFE') {
      matchStock = item.available_qty > 5;
    }

    return matchSearch && matchStock;
  });

  // Lọc lịch sử biến động kho
  const filteredTransactions = transactions.filter(tx => {
    // 1. Lọc theo loại biến động
    const matchType = txTypeFilter === 'ALL' || tx.type === txTypeFilter;
    if (!matchType) return false;

    // 2. Lọc theo khoảng thời gian
    if (txTimeframe === 'ALL') return true;
    if (!tx.created_at) return false;

    const txDate = new Date(tx.created_at);
    const now = new Date();
    
    if (txTimeframe === 'TODAY') {
      return txDate.toDateString() === now.toDateString();
    }
    
    const diffTime = Math.abs(now - txDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (txTimeframe === '7DAYS') return diffDays <= 7;
    if (txTimeframe === '30DAYS') return diffDays <= 30;
    
    return true;
  });

  const handleOpenStockModal = (book) => {
    setSelectedBookForStock(book);
    setStockChangeType('STOCK_IN');
    setStockChangeQty('');
    setStockChangeReason('');
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async () => {
    if (!selectedBookForStock) return;
    const changeQty = parseInt(stockChangeQty, 10);

    if (isNaN(changeQty) || changeQty <= 0) {
      toast.warning('Số lượng thay đổi phải là số nguyên dương lớn hơn 0!', { title: 'Dữ liệu không hợp lệ' });
      return;
    }

    setIsSavingStock(true);
    try {
      const currentQty = selectedBookForStock.available_qty;
      let newQty = currentQty;

      if (stockChangeType === 'STOCK_IN') {
        newQty = currentQty + changeQty;
      } else {
        newQty = Math.max(0, currentQty - changeQty);
      }

      await api.put(`/inventory/${selectedBookForStock.book_id}`, {
        availableQty: newQty,
        type: stockChangeType,
        reason: stockChangeReason.trim() || undefined
      });

      queryClient.invalidateQueries(['adminInventory']);
      queryClient.invalidateQueries(['adminInventoryTransactions']);
      toast.success('Đã cập nhật tồn kho và ghi nhật ký thành công!', { title: 'Cập nhật kho' });
      setIsStockModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi cập nhật kho' });
    } finally {
      setIsSavingStock(false);
    }
  };

  const getStockColor = (qty) => {
    if (qty <= 0) return 'text-red-700 border border-red-200 bg-red-50/50';
    if (qty <= 5) return 'text-amber-700 border border-amber-200 bg-amber-50/50';
    return 'text-green-700 border border-green-200 bg-green-50/50';
  };

  const getTxTypeBadge = (type) => {
    switch (type) {
      case 'STOCK_IN':
        return <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-emerald-800 bg-emerald-50 border border-emerald-200">Nhập kho</span>;
      case 'STOCK_OUT':
        return <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-blue-800 bg-blue-50 border border-blue-200">Xuất kho</span>;
      case 'ADJUSTMENT':
        return <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-amber-800 bg-amber-50 border border-amber-200">Điều chỉnh</span>;
      case 'RETURN':
        return <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-purple-800 bg-purple-50 border border-purple-200">Hoàn hàng</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-gray-800 bg-gray-50 border border-gray-200">{type}</span>;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-serif font-semibold text-ink">Quản lý tồn kho</h2>
        
        {/* Bộ lọc Tìm kiếm & Trạng thái tồn kho */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm sách hoặc tác giả..."
            value={searchTermStock}
            onChange={e => setSearchTermStock(e.target.value)}
            className="border border-divider rounded-none px-3.5 py-1.5 w-64 text-xs focus:outline-none focus:border-ink bg-white text-ink font-sans tracking-wide"
          />
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            className="border border-divider rounded-none px-3 py-1.5 text-xs focus:outline-none focus:border-ink bg-white text-ink font-sans tracking-wide cursor-pointer"
          >
            <option value="ALL">Tất cả tồn kho</option>
            <option value="OUT_OF_STOCK">Hết hàng (0)</option>
            <option value="LOW_STOCK">Sắp hết hàng (1-5)</option>
            <option value="SAFE">Tồn kho an toàn (&gt;5)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-divider shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="text-left py-3 px-4">Sách</th>
                <th className="text-center py-3 px-4">Sẵn có</th>
                <th className="text-center py-3 px-4">Đang giữ</th>
                <th className="text-center py-3 px-4">Đã bán</th>
                <th className="text-center py-3 px-4">Cập nhật số lượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {filteredInventory.map(item => {
                return (
                  <tr key={item.book_id} className="hover:bg-[#fcfbf9] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-serif font-medium text-ink line-clamp-1">{item.title}</div>
                      <div className="text-xs text-ink-light">{item.author}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-semibold tracking-wider px-2 py-1 rounded-none ${getStockColor(item.available_qty)}`}>
                        {item.available_qty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-[#2C4A3B] font-semibold">{item.reserved_qty}</td>
                    <td className="py-3 px-4 text-center text-ink-light">{item.sold_qty}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenStockModal(item)}
                        className="inline-flex items-center gap-1.5 border border-divider hover:border-ink hover:bg-surface-warm text-ink font-sans text-xs font-semibold py-1.5 px-3.5 transition-all rounded-none bg-white cursor-pointer"
                      >
                        <span>⚙️</span> Nhập / Điều chỉnh
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredInventory.length === 0 && (
            <p className="text-center py-12 text-ink-light italic">Không tìm thấy dữ liệu tồn kho phù hợp.</p>
          )}
        </div>
      )}

      {/* Nhật ký biến động kho */}
      <div className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-md font-serif font-semibold text-ink">Nhật ký biến động kho</h3>
          
          <div className="flex items-center gap-3">
            {/* Lọc khoảng thời gian */}
            <select
              value={txTimeframe}
              onChange={e => setTxTimeframe(e.target.value)}
              className="border border-divider rounded-none px-3 py-1 text-xs focus:outline-none focus:border-ink bg-white text-ink font-sans tracking-wide cursor-pointer"
            >
              <option value="ALL">Toàn thời gian</option>
              <option value="TODAY">Hôm nay</option>
              <option value="7DAYS">7 ngày qua</option>
              <option value="30DAYS">30 ngày qua</option>
            </select>

            {/* Lọc loại biến động */}
            <select
              value={txTypeFilter}
              onChange={e => setTxTypeFilter(e.target.value)}
              className="border border-divider rounded-none px-3 py-1 text-xs focus:outline-none focus:border-ink bg-white text-ink font-sans tracking-wide cursor-pointer"
            >
              <option value="ALL">Tất cả biến động</option>
              <option value="STOCK_IN">Nhập kho</option>
              <option value="STOCK_OUT">Xuất kho</option>
              <option value="ADJUSTMENT">Điều chỉnh</option>
              <option value="RETURN">Hoàn hàng</option>
            </select>
          </div>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 bg-surface-subtle animate-pulse rounded-none" />)}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-none border border-divider shadow-none">
            <table className="w-full text-sm">
              <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="text-left py-2.5 px-4">Thời gian</th>
                  <th className="text-left py-2.5 px-4">Sách</th>
                  <th className="text-center py-2.5 px-4">Loại biến động</th>
                  <th className="text-center py-2.5 px-4">Thay đổi</th>
                  <th className="text-center py-2.5 px-4">Tồn cuối</th>
                  <th className="text-left py-2.5 px-4">Lý do / Mô tả</th>
                  <th className="text-left py-2.5 px-4">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider-lt">
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#fcfbf9] transition-colors text-xs">
                    <td className="py-2.5 px-4 text-ink-light">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-serif font-medium text-ink line-clamp-1">{tx.book_title}</div>
                      <div className="text-[10px] text-ink-light">{tx.book_author}</div>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {getTxTypeBadge(tx.type)}
                    </td>
                    <td className={`py-2.5 px-4 text-center font-semibold ${tx.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td className="py-2.5 px-4 text-center font-medium text-ink">
                      {tx.new_qty}
                    </td>
                    <td className="py-2.5 px-4 text-ink-light italic">
                      {tx.reason || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-ink-light">
                      {tx.created_by_name || tx.created_by_email || 'Hệ thống'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <p className="text-center py-8 text-ink-light italic">Chưa có nhật ký biến động kho nào.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal Phiếu Nhập Kho nhanh */}
      {isStockModalOpen && selectedBookForStock && (
        <div className="fixed inset-0 bg-ink-80 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-[#fcfbf9] border border-[#c5a880]/30 w-full max-w-md shadow-2xl relative animate-scale-up rounded-none">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-divider-lt flex justify-between items-center bg-surface-warm">
              <div>
                <span className="text-[10px] text-ink-60 font-sans tracking-[0.2em] uppercase font-bold">Phiếu điều chuyển kho</span>
                <h3 className="text-base font-serif font-bold text-ink mt-0.5">Nhập / Điều chỉnh kho</h3>
              </div>
              <button 
                onClick={() => setIsStockModalOpen(false)}
                className="text-ink-60 hover:text-ink transition-colors cursor-pointer text-xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-white border border-divider p-3 rounded-none">
                <div className="text-xs text-ink-60 font-sans uppercase tracking-widest">Sách chọn</div>
                <div className="font-serif font-bold text-sm text-ink mt-1">{selectedBookForStock.title}</div>
                <div className="text-xs text-ink-60 mt-0.5">{selectedBookForStock.author}</div>
                
                <div className="flex gap-6 mt-3 pt-3 border-t border-divider-lt text-xs">
                  <div>
                    <span className="text-ink-60 font-sans tracking-wide">Sẵn có hiện tại:</span>
                    <span className="ml-1.5 font-bold text-ink">{selectedBookForStock.available_qty}</span>
                  </div>
                  <div>
                    <span className="text-ink-60 font-sans tracking-wide">Đang giữ:</span>
                    <span className="ml-1.5 font-bold text-[#2C4A3B]">{selectedBookForStock.reserved_qty}</span>
                  </div>
                </div>
              </div>

              {/* Loại biến động */}
              <div>
                <label className="block text-[11px] text-ink-60 font-sans uppercase tracking-wider mb-1.5 font-bold">Loại giao dịch</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStockChangeType('STOCK_IN')}
                    className={`py-2 px-3 text-xs font-bold uppercase tracking-widest text-center border transition-all rounded-none cursor-pointer ${
                      stockChangeType === 'STOCK_IN'
                        ? 'border-[#2C4A3B] bg-[#2C4A3B]/5 text-[#2C4A3B]'
                        : 'border-divider bg-white text-ink-60 hover:border-ink hover:text-ink'
                    }`}
                  >
                    📥 Nhập thêm hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockChangeType('ADJUSTMENT')}
                    className={`py-2 px-3 text-xs font-bold uppercase tracking-widest text-center border transition-all rounded-none cursor-pointer ${
                      stockChangeType === 'ADJUSTMENT'
                        ? 'border-rose-700 bg-rose-50 text-rose-800'
                        : 'border-divider bg-white text-ink-60 hover:border-ink hover:text-ink'
                    }`}
                  >
                    🛠️ Điều chỉnh giảm
                  </button>
                </div>
              </div>

              {/* Số lượng thay đổi */}
              <div>
                <label className="block text-[11px] text-ink-60 font-sans uppercase tracking-wider mb-1.5 font-bold">Số lượng thay đổi</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ví dụ: 10"
                  value={stockChangeQty}
                  onChange={e => setStockChangeQty(e.target.value)}
                  className="w-full border border-divider rounded-none px-3.5 py-2 text-sm focus:outline-none focus:border-ink bg-white text-ink font-mono font-semibold"
                />
              </div>

              {/* Lý do / Mô tả */}
              <div>
                <label className="block text-[11px] text-ink-60 font-sans uppercase tracking-wider mb-1.5 font-bold">Lý do chi tiết</label>
                <textarea
                  rows="3"
                  placeholder={stockChangeType === 'STOCK_IN' ? 'Nhập lý do (ví dụ: Nhập hàng đợt mới từ NXB...)' : 'Nhập lý do (ví dụ: Điều chỉnh hao hụt, sách lỗi hư hại...)'}
                  value={stockChangeReason}
                  onChange={e => setStockChangeReason(e.target.value)}
                  className="w-full border border-divider rounded-none px-3.5 py-2 text-xs focus:outline-none focus:border-ink bg-white text-ink font-sans tracking-wide leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-divider-lt flex justify-end gap-3 bg-[#faf8f5]">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                disabled={isSavingStock}
                className="border border-divider hover:border-ink hover:bg-surface-warm text-ink font-sans text-xs font-bold py-2.5 px-6 uppercase tracking-wider transition-all rounded-none bg-white cursor-pointer disabled:opacity-50"
              >
                Hủy phiếu
              </button>
              <button
                type="button"
                onClick={handleSaveStock}
                disabled={isSavingStock}
                className="bg-ink hover:bg-[#2C4A3B] text-white font-sans text-xs font-bold py-2.5 px-6 uppercase tracking-wider transition-all rounded-none cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingStock ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Xác nhận Lưu'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Tab Vector hóa RAG ──────────────────────────────────
function RAGIndexerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [uploadStates, setUploadStates] = useState({}); // { [bookId]: { status, message } }
  const [showOnlyIndexed, setShowOnlyIndexed] = useState(false); // Bộ lọc
  const fileRefs = useRef({});

  // Fetch danh sách sách, bao gồm cả rag_indexed_at
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['adminBooksRAG'],
    queryFn: () => api.get('/books?limit=100').then(r => r.data.data?.books || r.data.data || [])
  });

  const allBooks = Array.isArray(data) ? data : [];

  // Bộ đếm thống kê
  const indexedCount = allBooks.filter(b => b.rag_indexed_at).length;
  const notIndexedCount = allBooks.length - indexedCount;

  // Lọc theo bộ lọc
  const books = showOnlyIndexed
    ? allBooks.filter(b => b.rag_indexed_at)
    : allBooks;

  const handleUpload = async (bookId) => {
    const fileInput = fileRefs.current[bookId];
    if (!fileInput?.files?.[0]) {
      toast.warning('Vui lòng chọn file PDF trước!', { title: 'Chưa chọn file' });
      return;
    }
    const file = fileInput.files[0];

    setUploadStates(prev => ({ ...prev, [bookId]: { status: 'loading', message: 'Đang tải lên & vector hóa...' } }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/ai/upload/${bookId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });

      setUploadStates(prev => ({ ...prev, [bookId]: { status: 'success', message: 'Vector hóa thành công! AI đã sẵn sàng trả lời về cuốn sách này.' } }));
      fileInput.value = '';
      // Refetch để cập nhật badge rag_indexed_at ngay lập tức
      queryClient.invalidateQueries(['adminBooksRAG']);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setUploadStates(prev => ({ ...prev, [bookId]: { status: 'error', message: 'Lỗi: ' + errMsg } }));
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return null;
    return new Date(isoStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Header + Thống kê */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-serif font-semibold text-ink mb-1">Vector hóa tài liệu RAG</h2>
          <p className="text-xs text-ink-light">Tải lên file PDF để AI có thể hỏi đáp thông minh về nội dung từng cuốn sách.</p>
        </div>

        {/* Thẻ thống kê */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="bg-green-50/30 border border-green-200 rounded-none px-4 py-2.5 text-center">
            <div className="text-2xl font-serif font-medium text-green-700">{indexedCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-green-600 font-medium">Đã vector hóa</div>
          </div>
          <div className="bg-surface-subtle/50 border border-divider rounded-none px-4 py-2.5 text-center">
            <div className="text-2xl font-serif font-medium text-ink-light">{notIndexedCount}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-light font-medium">Chưa xử lý</div>
          </div>
        </div>
      </div>

      {/* Thanh lọc + Lưu ý */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="bg-surface-warm border border-divider border-l-4 border-l-[#2C4A3B] rounded-none px-4 py-3 text-xs text-ink-light flex gap-2 flex-1">
          <span>💡</span>
          <span>Đảm bảo server AI (FastAPI) đang chạy tại <code className="bg-surface-subtle px-1 font-mono text-[11px] text-ink">localhost:8000</code> trước khi tải lên. Quá trình có thể mất từ 30 giây đến 2 phút.</span>
        </div>
        {/* Bộ lọc */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <button
            onClick={() => setShowOnlyIndexed(false)}
            className={`py-2 px-4 rounded-none text-xs font-medium uppercase tracking-wider transition-colors border ${!showOnlyIndexed ? 'bg-ink text-white border-ink' : 'bg-white text-ink-light border-divider hover:bg-[#faf8f5]'}`}
          >
            Tất cả ({allBooks.length})
          </button>
          <button
            onClick={() => setShowOnlyIndexed(true)}
            className={`py-2 px-4 rounded-none text-xs font-medium uppercase tracking-wider transition-colors border ${showOnlyIndexed ? 'bg-green-700 text-white border-green-700' : 'bg-white text-ink-light border-divider hover:bg-[#faf8f5]'}`}
          >
            Đã vector hóa ({indexedCount})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {books.map(book => {
            const state = uploadStates[book.id];
            const isIndexed = !!book.rag_indexed_at;
            const indexedDate = formatDate(book.rag_indexed_at);

            return (
              <div
                key={book.id}
                className={`border rounded-none p-5 shadow-none transition-colors hover:bg-[#fcfbf9] ${isIndexed ? 'bg-green-50/10 border-green-200' : 'bg-white border-divider'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Thông tin sách */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-medium text-ink line-clamp-1">{book.title}</span>
                      {isIndexed && (
                        <span className="inline-flex items-center gap-1 bg-green-50/50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-none border border-green-200">
                          Đã vector hóa
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-light mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>{book.author} · ID: {book.id}</span>
                      {isIndexed && (
                        <span className="text-green-700 font-medium">
                          🕐 Lần cuối: {indexedDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Upload controls */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      ref={el => fileRefs.current[book.id] = el}
                      className="text-xs text-ink-light file:mr-2 file:py-1.5 file:px-3 file:rounded-none file:border file:border-divider file:text-xs file:font-medium file:bg-surface-warm file:text-ink hover:file:bg-surface-subtle cursor-pointer"
                    />
                    <button
                      onClick={() => handleUpload(book.id)}
                      disabled={state?.status === 'loading'}
                      className={`disabled:opacity-50 text-white font-medium py-2 px-4 rounded-none text-xs transition-colors uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 ${isIndexed ? 'bg-green-700 hover:bg-green-800' : 'bg-[#2C4A3B] hover:bg-[#1e3529]'}`}
                    >
                      {state?.status === 'loading' ? (
                        <>
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Đang xử lý...
                        </>
                      ) : isIndexed ? (
                        'Vector hóa lại'
                      ) : (
                        'Vector hóa'
                      )}
                    </button>
                  </div>
                </div>

                {/* Trạng thái upload */}
                {state && (
                  <div className={`mt-3 text-xs px-4 py-2.5 rounded-none font-medium border ${
                    state.status === 'success' ? 'bg-green-50/50 text-green-700 border-green-200' :
                    state.status === 'error' ? 'bg-red-50/50 text-red-700 border-red-200' :
                    'bg-amber-50/50 text-amber-700 border-amber-200'
                  }`}>
                    {state.status === 'loading' && '⏳ '}
                    {state.status === 'success' && '✓ '}
                    {state.status === 'error' && '✕ '}
                    {state.message}
                  </div>
                )}
              </div>
            );
          })}
          {books.length === 0 && (
            <p className="text-center py-12 text-ink-light italic">
              {showOnlyIndexed ? 'Chưa có sách nào được vector hóa.' : 'Chưa có sách nào trong hệ thống.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Sub-component: Tab Quản lý Đơn Hàng ──────────────────────────────────
function OrderManagerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  // States nâng cấp quản lý đơn hàng
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Tự động bỏ chọn checkbox khi bộ lọc thay đổi
  React.useEffect(() => {
    setSelectedOrderIds([]);
  }, [statusFilter, paymentMethodFilter, searchTerm, dateFilter]);

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['adminOrders', dateFilter],
    queryFn: () => api.get(`/admin/orders`, { params: { date: dateFilter } }).then(r => r.data.data)
  });

  const filteredOrders = allOrders?.filter(o => {
    // 1. Lọc theo trạng thái
    if (statusFilter && o.status !== statusFilter) return false;

    // 2. Lọc theo phương thức thanh toán
    if (paymentMethodFilter !== 'ALL' && o.payment_method !== paymentMethodFilter) return false;

    // 3. Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      const matchId = String(o.id).includes(term);
      const matchName = o.shipping_name?.toLowerCase().includes(term) || o.full_name?.toLowerCase().includes(term);
      const matchPhone = o.shipping_phone?.includes(term);
      const matchEmail = o.email?.toLowerCase().includes(term);
      return matchId || matchName || matchPhone || matchEmail;
    }

    return true;
  }) || [];

  const selectedOrder = allOrders?.find(o => o.id === selectedOrderId);

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, cancelReason }) => api.put(`/admin/orders/${orderId}/status`, { status, cancelReason }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['adminOrders']);
      // Also invalidate customer-facing queries so their UI updates too
      queryClient.invalidateQueries(['myOrders']);
      queryClient.invalidateQueries(['orderDetail', String(vars.orderId)]);
      toast.success('Đã cập nhật trạng thái đơn hàng!', { title: 'Cập nhật thành công' });
    },
    onError: (err) => toast.error(err.response?.data?.error || err.message, { title: 'Lỗi' })
  });

  // Pipeline order (excluding CANCELLED)
  const PIPELINE = ['PENDING', 'CONFIRMED', 'PACKAGING', 'DELIVERING', 'DELIVERED'];

  const STEP_LABELS = {
    ALL: 'Tất cả',
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PACKAGING: 'Đóng gói',
    DELIVERING: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
  };

  const STEP_COLORS = {
    ALL:        { dot: 'bg-ink',        badge: 'bg-surface-subtle text-ink border-divider',     bar: 'bg-ink'        },
    PENDING:    { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-300',   bar: 'bg-amber-400'  },
    CONFIRMED:  { dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-300',      bar: 'bg-blue-400'   },
    PACKAGING:  { dot: 'bg-indigo-400', badge: 'bg-indigo-50 text-indigo-700 border-indigo-300',bar: 'bg-indigo-400' },
    DELIVERING: { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-300',bar: 'bg-orange-400' },
    DELIVERED:  { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-300',   bar: 'bg-green-500'  },
    CANCELLED:  { dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 border-red-300',         bar: 'bg-red-400'    },
  };

  const getNextStatus = (current) => {
    const idx = PIPELINE.indexOf(current);
    if (idx === -1 || idx === PIPELINE.length - 1) return null;
    return PIPELINE[idx + 1];
  };

  const getStepIndex = (status) => PIPELINE.indexOf(status);

  const handleAdvance = (order) => {
    const next = getNextStatus(order.status);
    if (!next) return;
    updateStatusMutation.mutate({ orderId: order.id, status: next });
  };

  const handleCancel = (order) => {
    const reason = window.prompt(`Nhập lý do hủy đơn hàng #${order.id} (Tùy chọn):`);
    if (reason === null) return;
    updateStatusMutation.mutate({ 
      orderId: order.id, 
      status: 'CANCELLED', 
      cancelReason: reason.trim() || 'Hủy bởi Quản trị viên' 
    });
  };

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedOrderIds(prev => [...prev, id]);
    } else {
      setSelectedOrderIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk operation handlers
  const handleBulkConfirm = async () => {
    const pendingOrders = filteredOrders.filter(o => selectedOrderIds.includes(o.id) && o.status === 'PENDING');
    if (pendingOrders.length === 0) {
      toast.warning('Không có đơn hàng nào ở trạng thái "Chờ xác nhận" trong danh sách đã chọn.', { title: 'Thông báo' });
      return;
    }
    
    if (!window.confirm(`Xác nhận duyệt hàng loạt ${pendingOrders.length} đơn hàng đang chọn?`)) return;

    try {
      for (const order of pendingOrders) {
        await updateStatusMutation.mutateAsync({ orderId: order.id, status: 'CONFIRMED' });
      }
      toast.success(`Đã duyệt thành công ${pendingOrders.length} đơn hàng!`, { title: 'Thành công' });
      setSelectedOrderIds([]);
    } catch (err) {
      // Handled by onError of mutation
    }
  };

  const handleBulkCancel = async () => {
    const cancellableOrders = filteredOrders.filter(o => selectedOrderIds.includes(o.id) && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
    if (cancellableOrders.length === 0) {
      toast.warning('Không có đơn hàng nào đủ điều kiện hủy trong danh sách đã chọn.', { title: 'Thông báo' });
      return;
    }

    const reason = window.prompt(`Nhập lý do hủy hàng loạt cho ${cancellableOrders.length} đơn hàng đang chọn:`);
    if (reason === null) return;

    const cancelReason = reason.trim() || 'Hủy hàng loạt bởi Quản trị viên';

    try {
      for (const order of cancellableOrders) {
        await updateStatusMutation.mutateAsync({ orderId: order.id, status: 'CANCELLED', cancelReason });
      }
      toast.success(`Đã hủy thành công ${cancellableOrders.length} đơn hàng!`, { title: 'Thành công' });
      setSelectedOrderIds([]);
    } catch (err) {
      // Handled by onError of mutation
    }
  };

  // Print invoice handler
  const handlePrintInvoice = (selectedOrder) => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Không thể mở cửa sổ in. Vui lòng tắt trình chặn pop-up.', { title: 'Lỗi' });
      return;
    }
    
    const itemsHtml = selectedOrder.items.map((item, idx) => {
      const title = item.title || item.bookTitle || 'Sách không tên';
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || 0);
      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e0ece7; text-align: center; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e0ece7; font-family: Georgia, serif; font-size: 13px; color: #1c1c1c;">${title}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e0ece7; text-align: right; font-family: monospace; font-size: 12px;">${price.toLocaleString('vi-VN')} đ</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e0ece7; text-align: center; font-family: monospace; font-size: 12px; color: #666;">${qty}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e0ece7; text-align: right; font-family: monospace; font-size: 12px; font-weight: bold; color: #2C4A3B;">${(price * qty).toLocaleString('vi-VN')} đ</td>
        </tr>
      `;
    }).join('');

    const totalOrigin = Number(selectedOrder.total_amount) + Number(selectedOrder.discount_amount || 0);
    const discountHtml = Number(selectedOrder.discount_amount || 0) > 0 
      ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: #666;">
          <span style="text-transform: uppercase; letter-spacing: 0.5px;">Tổng tiền gốc:</span>
          <span style="font-family: monospace;">${totalOrigin.toLocaleString('vi-VN')} đ</span>
        </div>
        ${selectedOrder.coupon_code ? `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: #2C4A3B;">
            <span style="text-transform: uppercase; letter-spacing: 0.5px;">Mã giảm giá (${selectedOrder.coupon_code}):</span>
            <span style="font-family: monospace; font-weight: bold;">-${Number(selectedOrder.discount_amount).toLocaleString('vi-VN')} đ</span>
          </div>
        ` : `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: #2C4A3B;">
            <span style="text-transform: uppercase; letter-spacing: 0.5px;">Giảm giá:</span>
            <span style="font-family: monospace; font-weight: bold;">-${Number(selectedOrder.discount_amount).toLocaleString('vi-VN')} đ</span>
          </div>
        `}
      ` : '';

    const printContent = `
      <html>
        <head>
          <title>Hóa đơn Pigeon Bookstore #${selectedOrder.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1c1c1c; 
              padding: 40px; 
              margin: 0; 
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header { 
              text-align: center; 
              margin-bottom: 35px; 
              border-bottom: 2px solid #2C4A3B; 
              padding-bottom: 20px; 
            }
            .logo { 
              font-family: 'Playfair Display', serif; 
              font-size: 26px; 
              font-weight: bold; 
              letter-spacing: 3px; 
              color: #2C4A3B; 
              margin: 0; 
            }
            .slogan { 
              font-family: 'Playfair Display', serif;
              font-style: italic; 
              font-size: 11px; 
              color: #555; 
              margin-top: 6px; 
              letter-spacing: 1px;
            }
            .title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-top: 20px; 
              margin-bottom: 5px; 
              text-transform: uppercase; 
              letter-spacing: 2px; 
              color: #1c1c1c;
            }
            .meta-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 24px; 
              margin-bottom: 35px; 
            }
            .section-title { 
              font-size: 10px; 
              text-transform: uppercase; 
              letter-spacing: 1.5px; 
              color: #666; 
              font-weight: bold; 
              border-bottom: 1px solid #e0ece7; 
              padding-bottom: 6px; 
              margin-bottom: 10px; 
            }
            .info-box { 
              background: #faf8f5; 
              border: 1px solid #e0ece7; 
              padding: 16px; 
            }
            .info-row { 
              display: flex; 
              margin-bottom: 6px; 
              align-items: flex-start;
            }
            .info-label { 
              width: 90px; 
              color: #666; 
              font-weight: 600; 
              font-size: 11px; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-value { 
              font-weight: 500; 
              font-size: 12px; 
              color: #1c1c1c;
              flex: 1;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 35px; 
            }
            th { 
              background: #faf8f5; 
              padding: 12px 8px; 
              text-align: left; 
              font-weight: bold; 
              border-bottom: 2px solid #2C4A3B; 
              text-transform: uppercase; 
              font-size: 10px; 
              color: #666; 
              letter-spacing: 1px;
            }
            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .summary { 
              width: 320px; 
              background: #faf8f5; 
              border: 1px solid #e0ece7; 
              padding: 16px; 
            }
            .footer { 
              text-align: center; 
              margin-top: 70px; 
              font-size: 11px; 
              color: #777; 
              border-top: 1px dashed #c5a880; 
              padding-top: 20px; 
              font-style: italic; 
              font-family: 'Playfair Display', serif;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">PIGEON BOOKSTORE</div>
            <div class="slogan">"Khơi nguồn tri thức, chắp cánh tương lai"</div>
            <div class="title">Hóa đơn bán lẻ #${selectedOrder.id}</div>
            <div style="font-size: 11px; color: #666; margin-top: 5px; font-family: monospace;">NGÀY ĐẶT: ${new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</div>
          </div>

          <div class="meta-grid">
            <div class="info-box">
              <div class="section-title">Thông tin người nhận</div>
              <div class="info-row"><span class="info-label">Người nhận:</span><span class="info-value" style="font-family: Georgia, serif; font-size: 14px; font-weight: bold; color: #2C4A3B;">${selectedOrder.shipping_name || selectedOrder.full_name || 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Điện thoại:</span><span class="info-value" style="font-family: monospace; font-weight: bold;">${selectedOrder.shipping_phone || 'N/A'}</span></div>
              <div class="info-row"><span class="info-label">Địa chỉ:</span><span class="info-value">${selectedOrder.shipping_address || 'N/A'}</span></div>
            </div>
            <div class="info-box">
              <div class="section-title">Thông tin giao dịch</div>
              <div class="info-row"><span class="info-label">Trạng thái:</span><span class="info-value" style="font-weight: bold; color: #2C4A3B;">${STEP_LABELS[selectedOrder.status]}</span></div>
              <div class="info-row"><span class="info-label">Thanh toán:</span><span class="info-value" style="font-weight: bold;">${selectedOrder.payment_method === 'ONLINE' ? 'ONLINE (PAYOS)' : 'COD (TIỀN MẶT)'}</span></div>
              <div class="info-row"><span class="info-label">Ghi chú:</span><span class="info-value" style="font-style: italic; color: #555;">${selectedOrder.shipping_notes || 'Không có ghi chú'}</span></div>
            </div>
          </div>

          <div class="section-title">Danh sách sách đã mua</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">STT</th>
                <th>Tên Sách</th>
                <th style="width: 120px; text-align: right;">Đơn Giá</th>
                <th style="width: 70px; text-align: center;">SL</th>
                <th style="width: 140px; text-align: right;">Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-container">
            <div class="summary">
              ${discountHtml}
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #2C4A3B; margin-top: 6px; border-top: 1px solid #e0ece7; padding-top: 10px;">
                <span style="text-transform: uppercase; letter-spacing: 0.5px;">Tổng thực thu:</span>
                <span style="font-family: monospace; font-size: 16px;">${Number(selectedOrder.total_amount).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
          
          <div style="clear: both;"></div>

          <div class="footer">
            Cảm ơn quý khách đã mua sắm tại Pigeon Bookstore!<br>
            Chúc quý khách luôn tìm thấy những trang sách đầy cảm hứng.
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Summary counts
  const counts = {
    ALL: allOrders?.length || 0,
  };
  PIPELINE.forEach(s => { counts[s] = 0; });
  counts['CANCELLED'] = 0;
  allOrders?.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  return (
    <div className="relative">
      {/* Header + Stats + Filter */}
      <div className="flex flex-col gap-6 mb-7">
        <div className="text-center py-4 border-b border-divider/40 mb-2">
          <h2 className="text-xl font-serif font-bold text-ink uppercase tracking-widest relative inline-block">
            Quản lý tiến độ giao hàng
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-[#2C4A3B]"></span>
          </h2>
        </div>

        {/* Pipeline Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {['ALL', ...PIPELINE, 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => {
                if (s === 'ALL') {
                  setStatusFilter('');
                } else {
                  setStatusFilter(statusFilter === s ? '' : s);
                }
              }}
              className={`border rounded-none px-3 py-2.5 text-center transition-all ${
                (s === 'ALL' && !statusFilter) || (statusFilter === s)
                  ? `${STEP_COLORS[s].badge} border-current font-bold shadow-sm`
                  : 'bg-white border-divider hover:bg-surface-warm text-ink-light'
              }`}
            >
              <div className={`text-xl font-serif font-bold ${(s === 'ALL' && !statusFilter) || (statusFilter === s) ? '' : 'text-ink'}`}>
                {allOrders ? (counts[s] ?? 0) : '—'}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold mt-0.5">
                {STEP_LABELS[s]}
              </div>
            </button>
          ))}
        </div>

        {/* Unified Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 px-4 border border-divider bg-surface-warm/40">
          {/* Keyword Search */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-light">Tìm kiếm từ khóa:</span>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập mã ĐH, tên, SĐT, email..."
                className="w-full border border-divider rounded-none py-1.5 pl-3 pr-8 text-xs font-medium focus:outline-none focus:border-ink bg-white text-ink placeholder-stone-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-light">Phương thức thanh toán:</span>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full border border-divider rounded-none py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-ink bg-white text-ink cursor-pointer"
            >
              <option value="ALL">Tất cả hình thức</option>
              <option value="COD">COD (Tiền mặt)</option>
              <option value="ONLINE">ONLINE (Chuyển khoản)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-light">Lọc ngày đặt:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 border border-divider rounded-none py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-ink bg-white text-ink"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 underline cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
            <div className="flex gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setDateFilter(new Date().toLocaleDateString('en-CA'))}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1 border transition-all cursor-pointer ${
                  dateFilter === new Date().toLocaleDateString('en-CA')
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink border-divider hover:bg-surface-warm'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1 border transition-all cursor-pointer ${
                  !dateFilter
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink border-divider hover:bg-surface-warm'
                }`}
              >
                Tất cả ngày
              </button>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {(statusFilter || paymentMethodFilter !== 'ALL' || searchTerm || dateFilter) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-light">Bộ lọc đang áp dụng:</span>
            {statusFilter && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 border rounded-none ${STEP_COLORS[statusFilter]?.badge}`}>
                Trạng thái: {STEP_LABELS[statusFilter]}
                <button onClick={() => setStatusFilter('')} className="hover:opacity-70 leading-none text-[10px]">✕</button>
              </span>
            )}
            {paymentMethodFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 border border-divider bg-surface-subtle text-ink rounded-none">
                Thanh toán: {paymentMethodFilter}
                <button onClick={() => setPaymentMethodFilter('ALL')} className="hover:opacity-70 leading-none text-[10px]">✕</button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 border border-divider bg-surface-subtle text-ink rounded-none">
                Từ khóa: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:opacity-70 leading-none text-[10px]">✕</button>
              </span>
            )}
            {dateFilter && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 border border-divider bg-surface-subtle text-ink rounded-none">
                Ngày: {new Date(dateFilter).toLocaleDateString('vi-VN')}
                <button onClick={() => setDateFilter('')} className="hover:opacity-70 leading-none text-[10px]">✕</button>
              </span>
            )}
            <button
              onClick={() => {
                setStatusFilter('');
                setPaymentMethodFilter('ALL');
                setSearchTerm('');
                setDateFilter('');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 underline ml-1 cursor-pointer"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Bar (Floating at bottom center) */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#FAF8F5] border-2 border-[#2C4A3B] px-6 py-4 shadow-xl flex flex-col sm:flex-row items-center gap-4 transition-all duration-300 rounded-none w-[90%] max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#2C4A3B] animate-pulse rounded-none" />
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Đang chọn <strong className="text-sm font-serif font-bold text-[#2C4A3B]">{selectedOrderIds.length}</strong> đơn hàng
            </span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
            <button
              onClick={handleBulkConfirm}
              className="flex-1 sm:flex-none bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-2 px-4 rounded-none text-xs transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 border border-transparent shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
              Duyệt Hàng Loạt
            </button>
            <button
              onClick={handleBulkCancel}
              className="flex-1 sm:flex-none border border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold py-2 px-4 rounded-none text-xs transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 bg-white cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              Hủy Hàng Loạt
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs font-semibold text-ink-light hover:text-ink underline px-2 py-1 cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-divider shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded-none accent-[#2C4A3B] border-divider cursor-pointer"
                  />
                </th>
                <th className="text-left py-3 px-4">Mã ĐH</th>
                <th className="text-left py-3 px-4">Khách hàng</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Tổng tiền</th>
                <th className="text-left py-3 px-4 hidden lg:table-cell">Ngày đặt</th>
                <th className="text-center py-3 px-4">Tiến độ giao hàng</th>
                <th className="text-center py-3 px-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {filteredOrders.map(order => {
                const stepIdx = getStepIndex(order.status);
                const nextStatus = getNextStatus(order.status);
                const isCancelled = order.status === 'CANCELLED';
                const isDelivered = order.status === 'DELIVERED';
                const isUpdating = updateStatusMutation.isPending;
                const colors = STEP_COLORS[order.status] || STEP_COLORS.CANCELLED;

                return (
                  <tr key={order.id} className="hover:bg-[#fcfbf9] transition-colors">
                    {/* Checkbox */}
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                        className="w-4 h-4 rounded-none accent-[#2C4A3B] border-divider cursor-pointer"
                      />
                    </td>

                    {/* ID */}
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs text-ink-light font-semibold">#{order.id}</span>
                    </td>

                    {/* Khách hàng */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif font-semibold text-ink text-sm">{order.full_name}</span>
                        {order.payment_method === 'ONLINE' ? (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 border border-green-200 bg-green-50 text-green-700 rounded-none uppercase tracking-wider">
                            ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-none uppercase tracking-wider">
                            COD
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-light mt-0.5">{order.email}</div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="py-4 px-4 hidden md:table-cell whitespace-nowrap">
                      <div className="font-semibold text-[#2C4A3B]">
                        {Number(order.total_amount).toLocaleString('vi-VN')} đ
                      </div>
                      {Number(order.discount_amount || 0) > 0 && (
                        <div className="text-[10px] text-ink-light/80 mt-0.5">
                          {order.coupon_code ? (
                            <span>Mã: <strong className="uppercase text-[#2C4A3B]">{order.coupon_code}</strong> (-{Number(order.discount_amount).toLocaleString('vi-VN')}đ)</span>
                          ) : (
                            <span>Giảm: -{Number(order.discount_amount).toLocaleString('vi-VN')}đ</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Ngày đặt */}
                    <td className="py-4 px-4 text-ink-light text-xs hidden lg:table-cell whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </td>

                    {/* Pipeline mini stepper */}
                    <td className="py-4 px-4">
                      {isCancelled ? (
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 border rounded-none bg-red-50 text-red-700 border-red-300 uppercase tracking-wider">
                            ✕ Đã hủy
                          </span>
                          {order.cancel_reason && (
                            <span className="text-[10px] text-stone-500 italic max-w-[150px] truncate text-center" title={order.cancel_reason}>
                              Lý do: "{order.cancel_reason}"
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-0 min-w-[220px]">
                          {PIPELINE.map((step, i) => {
                            const isDone = i < stepIdx;
                            const isActive = i === stepIdx;
                            const c = STEP_COLORS[step];
                            return (
                              <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                  <div
                                    title={STEP_LABELS[step]}
                                    className={`w-2.5 h-2.5 rounded-full border transition-all ${
                                      isDone
                                        ? `${c.dot} border-transparent`
                                        : isActive
                                        ? `${c.dot} border-transparent ring-2 ring-offset-1 ring-current`
                                        : 'bg-white border-divider'
                                    }`}
                                  />
                                  <span className={`text-[9px] mt-0.5 font-medium uppercase tracking-wide whitespace-nowrap ${
                                    isActive ? 'text-ink font-bold' : isDone ? 'text-ink-light' : 'text-divider'
                                  }`}>
                                    {step === 'CONFIRMED' ? 'XN' : step === 'PACKAGING' ? 'ĐG' : step === 'DELIVERING' ? 'GH' : step === 'DELIVERED' ? 'OK' : 'CH'}
                                  </span>
                                </div>
                                {i < PIPELINE.length - 1 && (
                                  <div className={`flex-1 h-px mx-1 ${i < stepIdx ? STEP_COLORS[PIPELINE[i]].bar : 'bg-divider'}`} style={{ minWidth: '16px' }} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="w-full border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-[11px] transition-colors uppercase tracking-wider cursor-pointer text-center"
                        >
                          Chi tiết
                        </button>

                        {/* Print Invoice */}
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          className="w-full border border-[#2C4A3B]/30 hover:bg-[#2C4A3B]/5 text-[#2C4A3B] font-medium py-1 px-3 rounded-none text-[11px] transition-colors uppercase tracking-wider cursor-pointer text-center"
                        >
                          In hóa đơn
                        </button>

                        {/* Advance to next step */}
                        {!isCancelled && !isDelivered && nextStatus && (
                          <button
                            onClick={() => handleAdvance(order)}
                            disabled={isUpdating}
                            className="w-full text-white font-bold py-1 px-3 rounded-none text-[11px] transition-colors uppercase tracking-wider disabled:opacity-50 bg-[#2C4A3B] hover:bg-[#1e3529] cursor-pointer text-center"
                          >
                            → {STEP_LABELS[nextStatus]}
                          </button>
                        )}

                        {/* Cancel */}
                        {!isCancelled && !isDelivered && (
                          <button
                            onClick={() => handleCancel(order)}
                            disabled={isUpdating}
                            className="w-full border border-red-200 hover:bg-red-50 text-red-600 font-medium py-1 px-3 rounded-none text-[10px] transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer text-center"
                          >
                            Hủy đơn
                          </button>
                        )}

                        {isDelivered && (
                          <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider py-1">✓ Hoàn thành</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-ink-light italic">
                    {dateFilter || statusFilter || paymentMethodFilter !== 'ALL' || searchTerm ? (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span>Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.</span>
                        <button
                          onClick={() => {
                            setStatusFilter('');
                            setPaymentMethodFilter('ALL');
                            setSearchTerm('');
                            setDateFilter('');
                          }}
                          className="text-xs font-bold text-[#2C4A3B] hover:underline mt-1 cursor-pointer"
                        >
                          Xóa tất cả bộ lọc để tìm lại
                        </button>
                      </div>
                    ) : (
                      'Chưa có đơn hàng nào.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Chi tiết đơn hàng ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-none border border-divider shadow-none w-full max-w-2xl overflow-y-auto max-h-[92vh] text-ink">
            {/* Modal Header */}
            <div className="flex justify-between items-start px-8 pt-7 pb-4 border-b border-divider">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-serif font-medium text-ink uppercase tracking-wider">CHI TIẾT ĐƠN HÀNG #{selectedOrder.id}</h3>
                  {selectedOrder.payment_method === 'ONLINE' ? (
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 border border-green-200 bg-green-50 text-green-700 rounded-none uppercase tracking-wider">
                      ONLINE (PAYOS)
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-none uppercase tracking-wider">
                      COD (TIỀN MẶT)
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-light mt-1">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-ink-light hover:text-ink text-lg leading-none mt-1 cursor-pointer"
              >✕</button>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Full Stepper in Modal */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-ink-light mb-4 font-semibold">Tiến độ xử lý đơn hàng</h4>
                {selectedOrder.status === 'CANCELLED' ? (
                  <div className="border border-red-200 bg-red-50/30 px-5 py-3.5 flex flex-col gap-2 rounded-none">
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 text-lg font-bold">✕</span>
                      <div>
                        <p className="font-semibold text-red-700 text-sm">Đơn hàng đã bị hủy</p>
                        <p className="text-xs text-red-600/70 mt-0.5 font-medium">Đơn này không thể tiếp tục xử lý.</p>
                      </div>
                    </div>
                    {selectedOrder.cancel_reason && (
                      <div className="mt-1 bg-white border border-red-200/60 p-3 text-xs text-stone-700 rounded-none w-full text-left">
                        <span className="font-bold text-red-700 uppercase tracking-wider text-[10px] block mb-0.5">Lý do hủy đơn hàng:</span>
                        <span className="font-semibold italic text-stone-900">"{selectedOrder.cancel_reason}"</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Full visual stepper */}
                    <div className="flex items-start gap-0 mb-5 overflow-x-auto pb-2">
                      {PIPELINE.map((step, i) => {
                        const curIdx = getStepIndex(selectedOrder.status);
                        const isDone = i < curIdx;
                        const isActive = i === curIdx;
                        const c = STEP_COLORS[step];
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className={`w-8 h-8 flex items-center justify-center border font-mono text-xs font-bold transition-all ${
                                isDone
                                  ? `${c.dot} border-transparent text-white`
                                  : isActive
                                  ? `bg-white ${c.badge} ring-2 ring-current`
                                  : 'bg-white border-divider text-divider'
                              }`}>
                                {isDone ? '✓' : i + 1}
                              </div>
                              <span className={`text-[10px] mt-1.5 font-semibold uppercase tracking-wide text-center max-w-[60px] leading-tight ${
                                isActive ? 'text-ink font-bold' : isDone ? 'text-ink-light' : 'text-divider'
                              }`}>{STEP_LABELS[step]}</span>
                            </div>
                            {i < PIPELINE.length - 1 && (
                              <div className={`flex-1 h-px mt-4 mx-1 min-w-[30px] ${i < curIdx ? c.bar : 'bg-divider'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    {selectedOrder.status !== 'DELIVERED' && (
                      <div className="flex items-center justify-center gap-3 pt-1">
                        {getNextStatus(selectedOrder.status) && (
                          <button
                            onClick={() => {
                              updateStatusMutation.mutate({ orderId: selectedOrder.id, status: getNextStatus(selectedOrder.status) });
                            }}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 max-w-xs bg-[#2C4A3B] hover:bg-[#1e3529] disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-none text-xs transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            {updateStatusMutation.isPending ? (
                              <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang cập nhật...</>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                                Chuyển sang: {STEP_LABELS[getNextStatus(selectedOrder.status)]}
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const reason = window.prompt(`Nhập lý do hủy đơn hàng #${selectedOrder.id} (Tùy chọn):`);
                            if (reason === null) return;
                            updateStatusMutation.mutate({ 
                              orderId: selectedOrder.id, 
                              status: 'CANCELLED', 
                              cancelReason: reason.trim() || 'Hủy bởi Quản trị viên' 
                            });
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 hover:border-red-400 text-red-500 hover:text-red-700 font-medium py-2.5 px-4 rounded-none text-[11px] transition-all uppercase tracking-widest disabled:opacity-50 cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          Hủy đơn
                        </button>
                      </div>
                    )}
                    {selectedOrder.status === 'DELIVERED' && (
                      <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-2.5 rounded-none uppercase tracking-wider">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                        Đơn hàng đã hoàn thành giao hàng
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Info + Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Info */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-ink-light mb-2 font-semibold">Thông tin khách hàng</h4>
                  <div className="bg-[#faf8f5] border border-divider divide-y divide-divider">
                    <div className="flex px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Người nhận</span>
                      <span className="font-serif font-semibold text-ink text-sm">{selectedOrder.shipping_name || selectedOrder.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Điện thoại</span>
                      <span className="text-xs font-semibold text-ink">{selectedOrder.shipping_phone || 'N/A'}</span>
                    </div>
                    <div className="flex px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Địa chỉ</span>
                      <span className="text-xs text-ink leading-relaxed break-words">{selectedOrder.shipping_address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Tài khoản</span>
                      <span className="font-mono text-xs text-ink-light break-all">{selectedOrder.email}</span>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-ink-light mb-2 font-semibold">Thông tin đơn hàng</h4>
                  <div className="bg-[#faf8f5] border border-divider divide-y divide-divider h-full">
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Ngày đặt</span>
                      <span className="text-xs font-medium text-ink">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Trạng thái</span>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 border rounded-none uppercase tracking-wider ${STEP_COLORS[selectedOrder.status]?.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STEP_COLORS[selectedOrder.status]?.dot}`} />
                        {STEP_LABELS[selectedOrder.status]}
                      </span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Thanh toán</span>
                      <span className="text-xs font-medium text-ink uppercase">{selectedOrder.payment_method === 'ONLINE' ? 'ONLINE (PAYOS)' : 'COD'}</span>
                    </div>
                    <div className="flex px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Ghi chú</span>
                      <span className="text-xs text-ink italic leading-relaxed break-words">{selectedOrder.shipping_notes || 'Không có ghi chú'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-ink-light mb-2 font-semibold">Sách đã mua</h4>
                <div className="overflow-x-auto border border-divider rounded-none">
                  <table className="w-full text-sm">
                    <thead className="bg-[#faf8f5] text-ink-light border-b border-divider uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="text-left py-2.5 px-4">Tên Sách</th>
                        <th className="text-right py-2.5 px-4 w-28">Đơn Giá</th>
                        <th className="text-center py-2.5 px-4 w-20">SL</th>
                        <th className="text-right py-2.5 px-4 w-32">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider-lt">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => {
                          const title = item.title || item.bookTitle || 'Sách không tên';
                          const price = Number(item.price || 0);
                          const qty = Number(item.quantity || 0);
                          return (
                            <tr key={idx} className="hover:bg-[#fcfbf9] transition-colors">
                              <td className="py-2.5 px-4 font-serif font-medium text-ink">{title}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-xs">{price.toLocaleString('vi-VN')} đ</td>
                              <td className="py-2.5 px-4 text-center font-mono text-xs text-ink-light">{qty}</td>
                              <td className="py-2.5 px-4 text-right font-semibold font-mono text-xs">{(price * qty).toLocaleString('vi-VN')} đ</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-ink-light italic text-xs">Không có thông tin chi tiết sản phẩm.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total + Close */}
              <div className="bg-[#faf8f5] border border-divider p-4 space-y-2">
                {Number(selectedOrder.discount_amount || 0) > 0 ? (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-ink-light uppercase tracking-wider">Tổng tiền gốc:</span>
                      <span className="font-medium text-ink">
                        {(Number(selectedOrder.total_amount) + Number(selectedOrder.discount_amount || 0)).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    {selectedOrder.coupon_code && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-ink-light uppercase tracking-wider">Mã giảm giá đã áp dụng:</span>
                        <span className="font-semibold text-[#2C4A3B] uppercase bg-[#fdfaf7] px-1.5 py-0.5 border border-[#2C4A3B]/20 font-sans">
                          {selectedOrder.coupon_code}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-[#2C4A3B]">
                      <span className="uppercase tracking-wider">Số tiền giảm giá:</span>
                      <span className="font-medium">
                        -{Number(selectedOrder.discount_amount).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className="border-t border-divider/50 my-1"></div>
                  </>
                ) : null}
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-ink-light font-medium">Tổng tiền thực thu (Đã thanh toán):</span>
                  <span className="text-[#2C4A3B] font-serif font-bold text-xl">{Number(selectedOrder.total_amount).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-bold py-2 px-6 rounded-none transition-colors text-xs uppercase tracking-wider border border-transparent shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4"/></svg>
                  In Hóa Đơn
                </button>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="bg-surface-subtle hover:bg-divider-lt text-ink font-medium py-2 px-6 rounded-none transition-colors text-xs uppercase tracking-wider border border-divider cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Sub-component: Tab Tổng quan Dashboard ───────────────────────────────
function DashboardOverviewTab() {
  const toast = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [timeframe, setTimeframe] = useState('ALL'); // ALL, TODAY, LAST_7_DAYS, LAST_30_DAYS

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data)
  });

  const { data: allOrders } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => api.get(`/admin/orders`).then(r => r.data.data)
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-surface-subtle animate-pulse rounded-none border border-divider" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-surface-subtle animate-pulse rounded-none border border-divider" />
          <div className="h-80 bg-surface-subtle animate-pulse rounded-none border border-divider" />
        </div>
      </div>
    );
  }

  const { revenue = 0, discount = 0, orderStats = {}, userStats = {}, ragStats = { total: 0, vectorized: 0 }, topBooks = [], recentOrders = [] } = stats || {};

  // Lọc đơn hàng theo khoảng thời gian chọn
  const filteredOrders = allOrders ? allOrders.filter(order => {
    if (timeframe === 'ALL') return true;
    const orderDate = new Date(order.created_at);
    const now = new Date();
    if (timeframe === 'TODAY') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return orderDate >= todayStart;
    }
    if (timeframe === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= sevenDaysAgo;
    }
    if (timeframe === 'LAST_30_DAYS') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= thirtyDaysAgo;
    }
    return true;
  }) : [];

  // Tính toán số liệu động trên frontend dựa theo timeframe lọc
  const hasOrdersLoaded = Array.isArray(allOrders);
  
  const activeOrders = hasOrdersLoaded ? filteredOrders.filter(o => o.status !== 'CANCELLED') : [];
  const dynamicRevenue = hasOrdersLoaded ? activeOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) : revenue;
  const dynamicDiscount = hasOrdersLoaded ? activeOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0) : discount;

  // Chi tiết trạng thái đơn hàng
  const dynamicOrderStats = {
    PENDING: 0,
    CONFIRMED: 0,
    PACKAGING: 0,
    DELIVERING: 0,
    DELIVERED: 0,
    CANCELLED: 0
  };
  
  if (hasOrdersLoaded) {
    filteredOrders.forEach(o => {
      if (dynamicOrderStats[o.status] !== undefined) {
        dynamicOrderStats[o.status]++;
      }
    });
  } else {
    Object.keys(dynamicOrderStats).forEach(s => {
      dynamicOrderStats[s] = orderStats[s] || 0;
    });
  }

  // Top bán chạy
  let dynamicTopBooks = [];
  if (hasOrdersLoaded) {
    const bookSales = {};
    activeOrders.forEach(order => {
      order.items?.forEach(item => {
        const title = item.title || item.bookTitle || 'Sách không tên';
        if (!bookSales[title]) {
          bookSales[title] = { title, total_sold: 0 };
        }
        bookSales[title].total_sold += Number(item.quantity || 0);
      });
    });
    dynamicTopBooks = Object.values(bookSales)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);
  } else {
    dynamicTopBooks = topBooks.map(b => ({ id: b.id, title: b.title, total_sold: b.total_sold }));
  }

  // Trung bình mỗi đơn (AOV)
  const dynamicAOV = activeOrders.length > 0 ? Math.round(dynamicRevenue / activeOrders.length) : 0;

  // Tỷ lệ hủy đơn
  const cancelledCount = dynamicOrderStats.CANCELLED || 0;
  const totalOrdersCount = hasOrdersLoaded ? filteredOrders.length : Object.values(orderStats).reduce((a, b) => a + b, 0);
  const cancelRate = totalOrdersCount > 0 ? Math.round((cancelledCount / totalOrdersCount) * 100) : 0;

  // Đơn hàng hiển thị gần đây
  const dynamicRecentOrders = hasOrdersLoaded
    ? [...filteredOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
    : recentOrders;

  // CSV Export
  const handleExportCSV = () => {
    if (!allOrders || allOrders.length === 0) {
      toast.warning('Không có dữ liệu đơn hàng để xuất!', { title: 'Xuất CSV' });
      return;
    }

    const headers = ['Mã ĐH', 'Khách hàng', 'Email', 'Tổng tiền (đ)', 'Giảm giá (đ)', 'Phương thức TT', 'Trạng thái', 'Ngày đặt', 'Người nhận', 'SĐT nhận', 'Địa chỉ nhận', 'Sách đã mua'];
    const rows = allOrders.map(order => {
      const itemsStr = order.items?.map(i => `${i.title} (SL: ${i.quantity})`).join('; ') || '';
      return [
        order.id,
        order.full_name || '',
        order.email || '',
        order.total_amount,
        order.discount_amount || 0,
        order.payment_method || '',
        order.status,
        new Date(order.created_at).toLocaleString('vi-VN'),
        order.shipping_name || '',
        order.shipping_phone || '',
        order.shipping_address || '',
        itemsStr
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => {
      let str = String(val);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_don_hang_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất báo cáo CSV thành công!', { title: 'Xuất CSV' });
  };

  const selectedOrder = allOrders?.find(o => o.id === selectedOrderId);

  const STEP_LABELS = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    PACKAGING: 'Đóng gói',
    DELIVERING: 'Đang giao',
    DELIVERED: 'Đã giao',
    CANCELLED: 'Đã hủy',
  };

  const STEP_COLORS = {
    PENDING:    { dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-300'  },
    CONFIRMED:  { dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-300'      },
    PACKAGING:  { dot: 'bg-indigo-400', badge: 'bg-indigo-50 text-indigo-700 border-indigo-300'},
    DELIVERING: { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-300'},
    DELIVERED:  { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-300'   },
    CANCELLED:  { dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 border-red-300'         },
  };

  const maxOrderStatusVal = Math.max(...Object.values(dynamicOrderStats), 1);
  const maxTopBookVal = Math.max(...dynamicTopBooks.map(b => Number(b.total_sold)), 1);

  return (
    <div className="space-y-8">
      {/* Bộ lọc khoảng thời gian */}
      <div className="flex justify-between items-center bg-[#faf8f5]/60 border border-divider p-4 rounded-none">
        <div>
          <h2 className="text-sm font-serif font-semibold text-ink uppercase tracking-wider">Số liệu phân tích kinh doanh</h2>
          <p className="text-[10px] text-ink-light tracking-wide mt-0.5">Các chỉ số được cập nhật theo khoảng thời gian lựa chọn</p>
        </div>
        <div className="w-48">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-3 py-2 border border-divider rounded-none bg-white text-xs text-ink font-semibold focus:outline-none focus:border-[#2C4A3B] transition-colors cursor-pointer"
          >
            <option value="ALL">Toàn thời gian</option>
            <option value="TODAY">Hôm nay</option>
            <option value="LAST_7_DAYS">7 ngày qua</option>
            <option value="LAST_30_DAYS">30 ngày qua</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu */}
        <div className="bg-white border border-divider border-t-2 border-t-transparent hover:border-t-[#2C4A3B] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-ink/5 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-ink-light/80 uppercase">
                Doanh thu thực tế
              </span>
              <div className="p-1.5 bg-[#faf8f5] border border-divider/40 rounded-none group-hover:bg-[#2C4A3B]/10 group-hover:border-[#2C4A3B]/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-[#2C4A3B]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-serif font-bold text-[#2C4A3B] mt-4 tracking-tight flex items-baseline">
              {dynamicRevenue.toLocaleString('vi-VN')}
              <span className="text-sm font-sans font-normal text-ink-light/70 ml-1">đ</span>
            </div>
          </div>
          <div className="border-t border-divider/60 mt-5 pt-4 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Khuyến mãi đã giảm</span>
              <span className="font-mono text-red-600 font-semibold">-{dynamicDiscount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Trung bình/Đơn (AOV)</span>
              <span className="font-mono text-ink font-semibold">{dynamicAOV.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đơn đặt */}
        <div className="bg-white border border-divider border-t-2 border-t-transparent hover:border-t-ink/80 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-ink/5 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-ink-light/80 uppercase">
                Số lượng đơn đặt
              </span>
              <div className="p-1.5 bg-[#faf8f5] border border-divider/40 rounded-none group-hover:bg-[#f0ece7] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-ink-light">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-serif font-bold text-ink mt-4 tracking-tight flex items-baseline">
              {totalOrdersCount}
              <span className="text-sm font-sans font-normal text-ink-light/70 ml-1">đơn</span>
            </div>
          </div>
          <div className="border-t border-divider/60 mt-5 pt-4 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Giao thành công</span>
              <span className="font-mono text-green-700 font-semibold">{dynamicOrderStats.DELIVERED || 0} đơn</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Hủy đơn (Tỷ lệ %)</span>
              <span className={`font-mono font-semibold ${cancelRate > 20 ? 'text-red-600' : 'text-green-700'}`}>
                {dynamicOrderStats.CANCELLED || 0} đơn ({cancelRate}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Thành viên */}
        <div className="bg-white border border-divider border-t-2 border-t-transparent hover:border-t-[#3D4E5B] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-ink/5 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-ink-light/80 uppercase">
                Thành viên
              </span>
              <div className="p-1.5 bg-[#faf8f5] border border-divider/40 rounded-none group-hover:bg-[#3D4E5B]/10 group-hover:border-[#3D4E5B]/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-[#3D4E5B]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.75-2.906m-.173-4.094a3 3 0 1 1-.803-5.997 3.011 3.011 0 0 1 .803 5.997ZM21 8.25c0-1.38-1.13-2.5-2.5-2.5a2.502 2.502 0 0 0-2.185 1.283m4.685 1.217a2.502 2.502 0 0 1-2.185 1.283m1.077 7.78A8.974 8.974 0 0 0 21 12a8.974 8.974 0 0 0-3.428-7.011M12 15c-1.898 0-3.71-.47-5.309-1.299A3.001 3.001 0 0 0 2 16.5V18c0 .332.053.655.15.96A9.052 9.052 0 0 0 12 21c3.676 0 7.001-1.378 9.53-3.649A9.015 9.015 0 0 0 12 15Zm0-4.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-serif font-bold text-ink mt-4 tracking-tight flex items-baseline">
              {Object.values(userStats).reduce((a, b) => a + b, 0)}
              <span className="text-sm font-sans font-normal text-ink-light/70 ml-1">người</span>
            </div>
          </div>
          <div className="border-t border-divider/60 mt-5 pt-4 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Quản trị viên (Admin)</span>
              <span className="font-mono text-ink font-semibold">{userStats.ADMIN || 0}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Biên tập viên (Curator)</span>
              <span className="font-mono text-ink font-semibold">{userStats.CURATOR || 0}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Khách hàng thành viên</span>
              <span className="font-mono text-ink font-semibold">{userStats.CUSTOMER || 0}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Tiến độ RAG */}
        <div className="bg-white border border-divider border-t-2 border-t-transparent hover:border-t-green-700 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-ink/5 flex flex-col justify-between group">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-ink-light/80 uppercase">
                Tiến độ RAG
              </span>
              <div className="p-1.5 bg-[#faf8f5] border border-divider/40 rounded-none group-hover:bg-green-700/10 group-hover:border-green-700/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-green-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.904zM18 5.25L17 8l-1-2.75L13.25 5l2.75-1L17 1.25L18 4l2.75 1L18 5.25zM20 18.25L19 21l-1-2.75L15.25 18l2.75-1L19 14.25L20 17l2.75 1L20 18.25z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-serif font-bold text-green-700 mt-4 tracking-tight flex items-baseline">
              {ragStats.total > 0 ? Math.round((ragStats.vectorized / ragStats.total) * 100) : 0}
              <span className="text-sm font-sans font-normal text-ink-light/70 ml-1">%</span>
            </div>
          </div>
          <div className="border-t border-divider/60 mt-5 pt-4 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Đã vector hóa (AI)</span>
              <span className="font-mono text-green-700 font-semibold">{ragStats.vectorized} cuốn</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-light font-sans font-medium">Tổng số sách</span>
              <span className="font-mono text-ink font-semibold">{ragStats.total} cuốn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-divider rounded-none p-6 bg-white shadow-none">
          <h3 className="text-sm font-serif font-bold text-ink uppercase tracking-wider mb-5 border-b border-divider pb-2">
            Top 5 Sách bán chạy nhất
          </h3>
          {dynamicTopBooks.length === 0 ? (
            <p className="text-center py-12 text-ink-light italic text-xs">Chưa có dữ liệu bán sách trong khoảng thời gian này.</p>
          ) : (
            <div className="space-y-4">
              {dynamicTopBooks.map((book, idx) => {
                const pct = (Number(book.total_sold) / maxTopBookVal) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-serif font-semibold text-ink truncate max-w-[80%]">
                        {idx + 1}. {book.title}
                      </span>
                      <span className="font-mono text-ink-light font-bold">
                        {book.total_sold} cuốn
                      </span>
                    </div>
                    <div className="w-full bg-[#f0ece7] h-5 rounded-none overflow-hidden relative border border-divider">
                      <div 
                        className="bg-[#2C4A3B] h-full transition-all duration-500 rounded-none" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border border-divider rounded-none p-6 bg-white shadow-none">
          <h3 className="text-sm font-serif font-bold text-ink uppercase tracking-wider mb-5 border-b border-divider pb-2">
            Cơ cấu đơn hàng theo trạng thái
          </h3>
          <div className="space-y-4">
            {Object.entries(dynamicOrderStats).map(([status, count]) => {
              const pct = (count / maxOrderStatusVal) * 100;
              const isZero = count === 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-ink-light uppercase text-[10px] tracking-wider">
                      {STEP_LABELS[status] || status}
                    </span>
                    <span className="font-mono text-ink font-bold">
                      {count} đơn
                    </span>
                  </div>
                  <div className="w-full bg-[#f0ece7] h-5 rounded-none overflow-hidden relative border border-divider">
                    <div 
                      className={`h-full transition-all duration-500 rounded-none ${
                        status === 'DELIVERED' ? 'bg-green-700' :
                        status === 'CANCELLED' ? 'bg-red-700' :
                        status === 'PENDING' ? 'bg-amber-500' :
                        'bg-ink'
                      }`} 
                      style={{ width: isZero ? '0%' : `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="border border-divider rounded-none p-6 bg-white shadow-none">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 border-b border-divider pb-3">
          <h3 className="text-sm font-serif font-bold text-ink uppercase tracking-wider">
            Các đơn hàng gần đây nhất
          </h3>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-1.5 px-4 rounded-none text-xs transition-colors uppercase tracking-wider cursor-pointer"
          >
            📊 Xuất Báo Cáo CSV
          </button>
        </div>

        {dynamicRecentOrders.length === 0 ? (
          <p className="text-center py-8 text-ink-light italic text-xs">Chưa có đơn hàng nào trong khoảng thời gian này.</p>
        ) : (
          <div className="overflow-x-auto rounded-none border border-divider">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#faf8f5] text-ink-light border-b border-divider uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Mã ĐH</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Tổng tiền</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Ngày đặt</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider-lt">
                {dynamicRecentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#fcfbf9] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold">#{order.id}</td>
                    <td className="py-2.5 px-3 font-medium text-ink">{order.full_name || 'N/A'}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#2C4A3B] whitespace-nowrap">
                      {Number(order.total_amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 border rounded-none uppercase tracking-wide ${STEP_COLORS[order.status]?.badge || 'bg-surface-subtle text-ink border-divider'}`}>
                        {STEP_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-ink-light whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedOrderId(order.id)}
                        className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-1 px-2.5 rounded-none text-[10px] transition-colors uppercase tracking-wider cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal inside DashboardOverviewTab */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-sm">
          <div className="bg-white rounded-none border border-divider shadow-none w-full max-w-2xl overflow-y-auto max-h-[92vh] text-ink">
            <div className="flex justify-between items-start px-8 pt-7 pb-4 border-b border-divider">
              <div>
                <h3 className="text-xl font-serif font-medium text-ink">CHI TIẾT ĐƠN HÀNG #{selectedOrder.id}</h3>
                <p className="text-xs text-ink-light mt-1">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-ink-light hover:text-ink text-lg leading-none mt-1"
              >✕</button>
            </div>

            <div className="px-8 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-ink-light mb-2 font-semibold">Thông tin khách hàng</h4>
                  <div className="bg-[#faf8f5] border border-divider divide-y divide-divider">
                    <div className="flex px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Người nhận</span>
                      <span className="font-serif font-semibold text-ink text-sm">{selectedOrder.shipping_name || selectedOrder.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Điện thoại</span>
                      <span className="text-xs font-semibold text-ink">{selectedOrder.shipping_phone || 'N/A'}</span>
                    </div>
                    <div className="flex px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Địa chỉ</span>
                      <span className="text-xs text-ink leading-relaxed break-words">{selectedOrder.shipping_address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Tài khoản</span>
                      <span className="font-mono text-xs text-ink-light break-all">{selectedOrder.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase tracking-wider text-ink-light mb-2 font-semibold">Thông tin đơn hàng</h4>
                  <div className="bg-[#faf8f5] border border-divider divide-y divide-divider h-full">
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Ngày đặt</span>
                      <span className="text-xs font-medium text-ink">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Trạng thái</span>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 border rounded-none uppercase tracking-wider ${STEP_COLORS[selectedOrder.status]?.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STEP_COLORS[selectedOrder.status]?.dot}`} />
                        {STEP_LABELS[selectedOrder.status]}
                      </span>
                    </div>
                    <div className="flex px-4 py-2.5 gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-ink-light font-semibold w-20 flex-shrink-0">Ghi chú</span>
                      <span className="text-xs text-ink italic leading-relaxed break-words">{selectedOrder.shipping_notes || 'Không có ghi chú'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-ink-light mb-2 font-semibold">Sách đã mua</h4>
                <div className="overflow-x-auto border border-divider rounded-none">
                  <table className="w-full text-sm">
                    <thead className="bg-[#faf8f5] text-ink-light border-b border-divider uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="text-left py-2.5 px-4">Tên Sách</th>
                        <th className="text-right py-2.5 px-4 w-28">Đơn Giá</th>
                        <th className="text-center py-2.5 px-4 w-20">SL</th>
                        <th className="text-right py-2.5 px-4 w-32">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider-lt">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => {
                          const title = item.title || item.bookTitle || 'Sách không tên';
                          const price = Number(item.price || 0);
                          const qty = Number(item.quantity || 0);
                          return (
                            <tr key={idx} className="hover:bg-[#fcfbf9] transition-colors">
                              <td className="py-2.5 px-4 font-serif font-medium text-ink">{title}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-xs">{price.toLocaleString('vi-VN')} đ</td>
                              <td className="py-2.5 px-4 text-center font-mono text-xs text-ink-light">{qty}</td>
                              <td className="py-2.5 px-4 text-right font-semibold font-mono text-xs">{(price * qty).toLocaleString('vi-VN')} đ</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-ink-light italic text-xs">Không có thông tin chi tiết sản phẩm.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#faf8f5] border border-divider p-4 space-y-2">
                {Number(selectedOrder.discount_amount || 0) > 0 ? (
                  <>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-ink-light uppercase tracking-wider">Tổng tiền gốc:</span>
                      <span className="font-medium text-ink">
                        {(Number(selectedOrder.total_amount) + Number(selectedOrder.discount_amount || 0)).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    {selectedOrder.coupon_code && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-ink-light uppercase tracking-wider">Mã giảm giá đã áp dụng:</span>
                        <span className="font-semibold text-[#2C4A3B] uppercase bg-[#fdfaf7] px-1.5 py-0.5 border border-[#2C4A3B]/20 font-sans">
                          {selectedOrder.coupon_code}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-[#2C4A3B]">
                      <span className="uppercase tracking-wider">Số tiền giảm giá:</span>
                      <span className="font-medium">
                        -{Number(selectedOrder.discount_amount).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div className="border-t border-divider/50 my-1"></div>
                  </>
                ) : null}
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-ink-light font-medium">Tổng tiền thực thu (Đã thanh toán):</span>
                  <span className="text-[#2C4A3B] font-serif font-bold text-xl">{Number(selectedOrder.total_amount).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="bg-surface-subtle hover:bg-divider-lt text-ink font-medium py-2 px-6 rounded-none transition-colors text-xs uppercase tracking-wider border border-divider"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Tab Quản lý Người Dùng ───────────────────────────────
function UserManagerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedDetailUserId, setSelectedDetailUserId] = useState(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers', searchTerm, roleFilter],
    queryFn: () => api.get(`/admin/users`, { params: { search: searchTerm, role: roleFilter } }).then(r => r.data.data)
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => api.put(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('Cập nhật phân quyền thành công!', { title: 'Cập nhật' });
    },
    onError: (err) => toast.error(err.response?.data?.error || err.message, { title: 'Lỗi phân quyền' })
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) => api.put(`/admin/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('Cập nhật trạng thái tài khoản thành công!', { title: 'Trạng thái' });
    },
    onError: (err) => toast.error(err.response?.data?.error || err.message, { title: 'Lỗi cập nhật trạng thái' })
  });

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('Xóa tài khoản người dùng thành công!', { title: 'Xóa người dùng' });
    },
    onError: (err) => toast.error(err.response?.data?.error || err.message, { title: 'Lỗi khi xóa người dùng' })
  });

  const handleDeleteClick = (userToDelete) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa tài khoản người dùng',
      message: `Bạn có chắc chắn muốn xóa tài khoản "${userToDelete.full_name || userToDelete.email}" không? Hành động này sẽ xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan (hồ sơ, giỏ hàng, lịch sử đơn hàng, đánh giá, các cuộc hội thoại RAG...) và KHÔNG THỂ HOÀN TÁC!`,
      confirmText: 'Xác nhận xóa',
      variant: 'danger',
      onConfirm: () => {
        deleteUserMutation.mutate(userToDelete.id);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'border-red-200 text-red-700 bg-red-50/50';
      case 'CURATOR': return 'border-purple-200 text-purple-700 bg-purple-50/50';
      case 'CUSTOMER': return 'border-divider text-ink bg-surface-subtle';
      default: return 'border-divider text-ink bg-surface-subtle';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-serif font-semibold text-ink">Quản lý người dùng</h2>
        <div className="flex gap-2 w-full sm:max-w-lg">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-divider rounded-none py-2 px-3 text-xs font-semibold focus:outline-none focus:border-ink bg-white text-ink-light tracking-wider"
          >
            <option value="">TẤT CẢ VAI TRÒ</option>
            <option value="ADMIN">ADMIN</option>
            <option value="CURATOR">CURATOR</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
          <input
            type="text"
            placeholder="Tìm email hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-divider rounded-none py-2 px-4 text-sm focus:outline-none focus:border-ink bg-white text-ink"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-divider shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="text-left py-3 px-4 w-16">Avatar</th>
                <th className="text-left py-3 px-4">Thông tin</th>
                <th className="text-left py-3 px-4">Ngày đăng ký</th>
                <th className="text-center py-3 px-4 w-32">Trạng thái</th>
                <th className="text-center py-3 px-4 w-40">Phân quyền</th>
                <th className="text-center py-3 px-4 w-64">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {users?.map(u => {
                const isMe = u.id === currentUser.id;
                const initials = (u.full_name || u.email || 'U').substring(0, 2).toUpperCase();
                const isActive = u.is_active !== false;

                return (
                  <tr key={u.id} className="hover:bg-[#fcfbf9] transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 rounded-full bg-[#f0ece7] border border-divider flex items-center justify-center font-serif text-sm font-medium text-[#2C4A3B]">
                        {initials}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-serif font-medium text-ink flex items-center gap-2">
                        {u.full_name}
                        {isMe && <span className="text-[9px] uppercase tracking-wider bg-surface-subtle border border-divider text-ink-light px-2 py-0.5 rounded-none font-semibold">Bạn</span>}
                      </div>
                      <div className="text-xs text-ink-light">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 text-ink-light text-xs">
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 border rounded-none uppercase tracking-wider ${
                        isActive 
                          ? 'border-green-200 text-green-700 bg-green-50/50' 
                          : 'border-red-200 text-red-700 bg-red-50/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div title={isMe ? "Không thể tự đổi quyền của mình" : ""}>
                        <select
                          value={u.role}
                          onChange={(e) => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                          disabled={updateRoleMutation.isPending || isMe}
                          className={`text-xs font-semibold rounded-none px-3 py-1.5 border cursor-pointer outline-none text-center appearance-none transition-colors ${
                            isMe ? 'opacity-50 cursor-not-allowed border-divider bg-[#f0ece7] text-ink-light' : 'focus:border-ink bg-white'
                          } ${getRoleBadgeColor(u.role)}`}
                        >
                          <option value="CUSTOMER" className="bg-white text-ink text-left font-medium">CUSTOMER</option>
                          <option value="CURATOR" className="bg-white text-ink text-left font-medium">CURATOR</option>
                          <option value="ADMIN" className="bg-white text-ink text-left font-medium">ADMIN</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setSelectedDetailUserId(u.id)}
                          className="text-xs font-semibold py-1.5 px-3 rounded-none border border-divider hover:bg-surface-warm text-ink transition-colors uppercase tracking-wider bg-white cursor-pointer"
                        >
                          Hồ sơ
                        </button>
                        {!isMe ? (
                          <>
                            <button
                              onClick={() => toggleStatusMutation.mutate({ userId: u.id, isActive: !isActive })}
                              disabled={toggleStatusMutation.isPending}
                              className={`text-xs font-semibold py-1.5 px-3 rounded-none border transition-colors uppercase tracking-wider cursor-pointer ${
                                isActive
                                  ? 'border-red-200 hover:bg-red-50 text-red-700'
                                  : 'border-green-200 hover:bg-green-50 text-green-700'
                              }`}
                            >
                              {isActive ? 'Khóa' : 'Mở khóa'}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(u)}
                              disabled={deleteUserMutation.isPending}
                              className="text-xs font-semibold py-1.5 px-3 rounded-none border border-red-200 hover:bg-red-600 hover:text-white text-red-700 transition-colors uppercase tracking-wider bg-white cursor-pointer"
                            >
                              Xóa
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-ink-light/50 italic py-1.5 px-2 bg-surface-subtle border border-divider-lt">Bạn</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users?.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-ink-light italic">Không tìm thấy người dùng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {selectedDetailUserId && (
        <UserDetailModal
          userId={selectedDetailUserId}
          onClose={() => setSelectedDetailUserId(null)}
        />
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
}

// ─── Sub-component: Xem chi tiết / CRM người dùng ───────────────────────
function UserDetailModal({ userId, onClose }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedChatSessionId, setSelectedChatSessionId] = useState(null);

  // Fetch thông tin chi tiết người dùng
  const { data: activityData, isLoading, error } = useQuery({
    queryKey: ['adminUserActivity', userId],
    queryFn: () => api.get(`/admin/users/${userId}/activity`).then(r => r.data.data),
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white border border-divider w-full max-w-5xl shadow-2xl p-12 text-center rounded-none">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#2C4A3B] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-ink-light font-serif">Đang tải hồ sơ hoạt động của người dùng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activityData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white border border-divider w-full max-w-lg shadow-2xl p-8 rounded-none">
          <h3 className="text-lg font-serif font-semibold text-red-700 mb-4">Lỗi tải dữ liệu</h3>
          <p className="text-sm text-ink-light mb-6">{error?.response?.data?.error || error?.message || 'Có lỗi xảy ra khi tải hồ sơ hoạt động.'}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-ink hover:bg-ink-light text-white font-semibold py-2 px-6 rounded-none text-xs uppercase tracking-wider transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { profile, stats, orders, reviews, chats } = activityData;
  const initials = (profile.full_name || profile.email || 'U').substring(0, 2).toUpperCase();

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return 'border-amber-200 text-amber-700 bg-amber-50/50';
      case 'CONFIRMED':
        return 'border-blue-200 text-blue-700 bg-blue-50/50';
      case 'PACKAGING':
        return 'border-indigo-200 text-indigo-700 bg-indigo-50/50';
      case 'DELIVERING':
        return 'border-purple-200 text-purple-700 bg-purple-50/50';
      case 'DELIVERED':
        return 'border-green-200 text-green-700 bg-green-50/50';
      case 'CANCELLED':
        return 'border-red-200 text-red-700 bg-red-50/50';
      default:
        return 'border-divider text-ink bg-surface-subtle';
    }
  };

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'PACKAGING': return 'Đang đóng gói';
      case 'DELIVERING': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao thành công';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-divider w-full max-w-5xl shadow-2xl flex flex-col my-8 max-h-[90vh] overflow-hidden rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-divider bg-[#faf8f5] flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-light font-semibold mb-0.5">
              HỒ SƠ KHÁCH HÀNG & CRM
            </p>
            <h3 className="text-xl font-serif font-semibold text-ink leading-tight">
              {profile.full_name || profile.email}
            </h3>
          </div>
          <button onClick={onClose} className="text-ink-light hover:text-ink transition-colors p-1 ml-4 cursor-pointer bg-transparent border-0">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body content (Scrollable/Grid) */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Cột trái: Thông tin cá nhân & KPIs */}
          <div className="w-full md:w-80 flex-shrink-0 border-r border-divider bg-[#faf8f5] flex flex-col overflow-y-auto p-6 space-y-6">
            
            {/* Avatar block */}
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-divider/60">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#e0d9d0] to-[#fcfbf9] border border-divider flex items-center justify-center font-serif text-2xl font-semibold text-[#2C4A3B] shadow-inner">
                {initials}
              </div>
              <div>
                <h4 className="font-serif font-bold text-ink text-base">{profile.full_name || 'Khách hàng'}</h4>
                <p className="text-xs text-ink-light font-mono mt-0.5">{profile.email}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
                  <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 border rounded-none uppercase tracking-wider ${
                    profile.role === 'ADMIN' 
                      ? 'border-red-200 text-red-700 bg-red-50/50' 
                      : profile.role === 'CURATOR'
                      ? 'border-purple-200 text-purple-700 bg-purple-50/50'
                      : 'border-divider text-ink bg-surface-subtle'
                  }`}>
                    {profile.role}
                  </span>
                  <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 border rounded-none uppercase tracking-wider ${
                    profile.is_active !== false
                      ? 'border-green-200 text-green-700 bg-green-50/50'
                      : 'border-red-200 text-red-700 bg-red-50/50'
                  }`}>
                    {profile.is_active !== false ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile info fields */}
            <div className="space-y-4 text-xs border-b border-divider/60 pb-6">
              <h5 className="text-[10px] uppercase tracking-wider text-ink-light font-bold mb-3">Thông tin chi tiết</h5>
              
              <div>
                <span className="block text-[10px] uppercase text-ink-light/70 font-semibold mb-1">Số điện thoại</span>
                <span className="font-medium text-ink">{profile.phone || <span className="italic text-ink-light/50">Chưa cập nhật</span>}</span>
              </div>

              <div>
                <span className="block text-[10px] uppercase text-ink-light/70 font-semibold mb-1">Địa chỉ nhận hàng</span>
                <span className="font-medium text-ink break-words leading-relaxed">{profile.address || <span className="italic text-ink-light/50">Chưa cập nhật</span>}</span>
              </div>

              <div>
                <span className="block text-[10px] uppercase text-ink-light/70 font-semibold mb-1">Ngày đăng ký</span>
                <span className="font-mono text-ink">{new Date(profile.created_at).toLocaleDateString('vi-VN')} {new Date(profile.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Numeric KPI grids */}
            <div className="space-y-3">
              <h5 className="text-[10px] uppercase tracking-wider text-ink-light font-bold">Chỉ số tích lũy</h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-divider p-3 text-center">
                  <p className="text-[8px] uppercase tracking-wider text-ink-light font-semibold mb-1">Đơn hàng</p>
                  <p className="text-lg font-serif font-bold text-[#2C4A3B]">{stats.totalOrders || 0}</p>
                </div>
                <div className="bg-white border border-divider p-3 text-center">
                  <p className="text-[8px] uppercase tracking-wider text-ink-light font-semibold mb-1">Đánh giá</p>
                  <p className="text-lg font-serif font-bold text-[#2C4A3B]">{stats.totalReviews || 0}</p>
                </div>
              </div>

              <div className="bg-white border border-divider p-3 text-center">
                <p className="text-[8px] uppercase tracking-wider text-ink-light font-semibold mb-1">Chi tiêu (Đã giao)</p>
                <p className="text-base font-serif font-bold text-[#2C4A3B]">
                  {Number(stats.totalSpent || 0).toLocaleString('vi-VN')} đ
                </p>
              </div>

              <div className="bg-white border border-divider p-3 text-center">
                <p className="text-[8px] uppercase tracking-wider text-ink-light font-semibold mb-1">Hội thoại tư vấn AI</p>
                <p className="text-lg font-serif font-bold text-[#2C4A3B]">{stats.totalChats || 0}</p>
              </div>
            </div>

          </div>

          {/* Cột phải: Tabbed activity history details */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tab navigation */}
            <div className="flex border-b border-divider bg-[#faf8f5] px-6 flex-shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-4 font-semibold text-xs tracking-wider border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-t-0 border-x-0 whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-[#2C4A3B] text-[#2C4A3B]'
                    : 'border-transparent text-ink-light hover:text-ink'
                }`}
              >
                LỊCH SỬ ĐƠN HÀNG ({orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-3 px-4 font-semibold text-xs tracking-wider border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-t-0 border-x-0 whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-[#2C4A3B] text-[#2C4A3B]'
                    : 'border-transparent text-ink-light hover:text-ink'
                }`}
              >
                ĐÁNH GIÁ SÁCH ({reviews?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('chats')}
                className={`py-3 px-4 font-semibold text-xs tracking-wider border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-t-0 border-x-0 whitespace-nowrap ${
                  activeTab === 'chats'
                    ? 'border-[#2C4A3B] text-[#2C4A3B]'
                    : 'border-transparent text-ink-light hover:text-ink'
                }`}
              >
                HỘI THOẠI AI ({chats?.length || 0})
              </button>
            </div>

            {/* Tab content wrapper (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Active Tab content */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {orders && orders.length > 0 ? (
                    <div className="overflow-x-auto border border-divider rounded-none">
                      <table className="w-full text-xs">
                        <thead className="bg-[#faf8f5] border-b border-divider text-ink-light font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 text-left w-20">Mã Đơn</th>
                            <th className="py-2.5 px-3 text-left w-36">Ngày Mua</th>
                            <th className="py-2.5 px-3 text-right w-28">Tổng tiền</th>
                            <th className="py-2.5 px-3 text-center w-24">Phương Thức</th>
                            <th className="py-2.5 px-3 text-center w-32">Trạng Thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider-lt">
                          {orders.map(o => (
                            <tr key={o.id} className="hover:bg-[#fcfbf9] transition-colors">
                              <td className="py-2.5 px-3 font-mono font-semibold text-ink">#{o.id}</td>
                              <td className="py-2.5 px-3 text-ink-light">
                                {new Date(o.created_at).toLocaleDateString('vi-VN')} {new Date(o.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-[#2C4A3B] font-mono">
                                {Number(o.total_amount).toLocaleString('vi-VN')} đ
                              </td>
                              <td className="py-2.5 px-3 text-center text-ink-light font-semibold">{o.payment_method}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 border rounded-none uppercase tracking-wider ${getOrderStatusBadge(o.status)}`}>
                                  {getOrderStatusLabel(o.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-surface-warm/30 border border-dashed border-divider-lt">
                      <p className="text-sm text-ink-light italic">Chưa có lịch sử đặt hàng nào.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map(r => (
                        <div key={r.id} className="border border-divider p-4 hover:border-ink-light transition-all bg-[#faf8f5]">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-[10px] uppercase text-ink-light font-bold block mb-0.5">Đánh giá sách</span>
                              <h4 className="font-serif font-semibold text-ink text-sm hover:text-[#2C4A3B] transition-colors">
                                {r.book_title}
                              </h4>
                            </div>
                            <span className="text-[10px] text-ink-light font-mono bg-white border border-divider px-2 py-0.5">
                              {new Date(r.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>

                          {/* Star Rating block */}
                          <div className="flex gap-0.5 my-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-divider'}`}
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>

                          <p className="text-xs text-ink leading-relaxed bg-white border border-divider-lt p-3 italic">
                            "{r.comment || 'Không có bình luận chữ.'}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-surface-warm/30 border border-dashed border-divider-lt">
                      <p className="text-sm text-ink-light italic">Chưa thực hiện đánh giá sách nào.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chats' && (
                <div className="space-y-4">
                  {chats && chats.length > 0 ? (
                    <div className="overflow-x-auto border border-divider rounded-none">
                      <table className="w-full text-xs">
                        <thead className="bg-[#faf8f5] border-b border-divider text-ink-light font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 text-left w-16">Phiên</th>
                            <th className="py-2.5 px-3 text-left">Tư Vấn Sách</th>
                            <th className="py-2.5 px-3 text-left w-48">Thời Gian Bắt Đầu</th>
                            <th className="py-2.5 px-3 text-center w-32">Nội dung</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider-lt">
                          {chats.map(c => (
                            <tr key={c.id} className="hover:bg-[#fcfbf9] transition-colors">
                              <td className="py-2.5 px-3 font-mono text-ink-light">#{c.id}</td>
                              <td className="py-2.5 px-3 font-serif font-medium text-ink">{c.book_title}</td>
                              <td className="py-2.5 px-3 text-ink-light">
                                {new Date(c.started_at).toLocaleDateString('vi-VN')} {new Date(c.started_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => setSelectedChatSessionId(c.id)}
                                  className="inline-flex items-center gap-1 border border-divider hover:border-ink hover:bg-[#f0ece7] text-ink font-semibold py-1 px-2.5 rounded-none text-[10px] transition-colors uppercase tracking-wider bg-white cursor-pointer"
                                >
                                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M8.5 12h7m-7 3h4m3.5-9a9 9 0 11-12.2 12.2L3 21l4.8-1.3A9 9 0 0118.5 6z" />
                                  </svg>
                                  Xem hội thoại
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-surface-warm/30 border border-dashed border-divider-lt">
                      <p className="text-sm text-ink-light italic">Chưa thực hiện cuộc hội thoại tư vấn AI nào.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Sub-modal: Xem chi tiết tin nhắn chat */}
      {selectedChatSessionId && (
        <ChatHistorySubModal
          sessionId={selectedChatSessionId}
          onClose={() => setSelectedChatSessionId(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-component: Modal xem tin nhắn hội thoại AI ───────────────────────
function ChatHistorySubModal({ sessionId, onClose }) {
  // Fetch danh sách tin nhắn
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ['adminChatMessages', sessionId],
    queryFn: () => api.get(`/admin/chats/${sessionId}/messages`).then(r => r.data.data),
    enabled: !!sessionId
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-divider w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider bg-[#faf8f5] flex-shrink-0">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#2C4A3B] font-semibold mb-0.5">
              CHI TIẾT LỊCH SỬ HỘI THOẠI AI
            </p>
            <h4 className="text-sm font-serif font-semibold text-ink leading-tight">
              Cuộc hội thoại #{sessionId}
            </h4>
          </div>
          <button onClick={onClose} className="text-ink-light hover:text-ink transition-colors p-1 ml-4 cursor-pointer bg-transparent border-0">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable conversation history */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fcfbf9] space-y-4 min-h-[350px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 py-20">
              <div className="w-8 h-8 border-3 border-[#2C4A3B] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-ink-light font-serif">Đang tải tin nhắn hội thoại...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-xs text-red-600 italic">Có lỗi xảy ra: {error?.response?.data?.error || error?.message}</p>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'USER';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                  >
                    <div className="text-[9px] text-ink-light font-mono mb-1 px-1">
                      {isUser ? 'Khách hàng' : 'Trợ lý Thư viện AI'} • {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      className={`p-3.5 text-xs max-w-[85%] leading-relaxed ${
                        isUser
                          ? 'bg-[#2C4A3B] text-white rounded-none shadow-sm'
                          : 'bg-[#faf8f5] text-ink border border-divider rounded-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xs text-ink-light italic">Không có tin nhắn nào trong cuộc hội thoại này.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#faf8f5] px-6 py-4 border-t border-divider flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-2 px-5 rounded-none text-xs uppercase tracking-wider transition-all cursor-pointer bg-white"
          >
            Đóng hội thoại
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Sub-component: Tab Quản lý Thể loại ──────────────────────────────────
function CategoryManagerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  // States cho tìm kiếm, bộ lọc và sắp xếp
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, EMPTY
  const [sortBy, setSortBy] = useState('NAME_ASC'); // NAME_ASC, BOOKS_DESC

  // State và query phục vụ tính năng xem nhanh danh sách sách của thể loại
  const [selectedCategoryForBooks, setSelectedCategoryForBooks] = useState(null);

  // Fetch danh mục
  const { data: categories, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => api.get('/categories').then(r => r.data.data || [])
  });

  // Fetch sách của danh mục được chọn để xem nhanh (adminMode=true)
  const { data: categoryBooksData, isLoading: loadingBooks } = useQuery({
    queryKey: ['categoryBooks', selectedCategoryForBooks?.id],
    queryFn: () => api.get('/books', {
      params: { categoryId: selectedCategoryForBooks?.id, limit: 100, adminMode: true }
    }).then(r => r.data.data?.books || r.data.data || []),
    enabled: !!selectedCategoryForBooks
  });
  const categoryBooks = Array.isArray(categoryBooksData) ? categoryBooksData : [];

  // Tính toán số liệu thống kê nhanh
  const stats = React.useMemo(() => {
    if (!categories) return { total: 0, active: 0, empty: 0 };
    const total = categories.length;
    const active = categories.filter(c => (c.book_count || 0) > 0).length;
    const empty = categories.filter(c => (c.book_count || 0) === 0).length;
    return { total, active, empty };
  }, [categories]);

  // Bộ lọc tìm kiếm và sắp xếp danh mục
  const filteredCategories = React.useMemo(() => {
    if (!categories) return [];
    return categories
      .filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' ||
          (statusFilter === 'ACTIVE' && (cat.book_count || 0) > 0) ||
          (statusFilter === 'EMPTY' && (cat.book_count || 0) === 0);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME_ASC') {
          return a.name.localeCompare(b.name, 'vi');
        } else if (sortBy === 'BOOKS_DESC') {
          return (b.book_count || 0) - (a.book_count || 0);
        }
        return 0;
      });
  }, [categories, searchQuery, statusFilter, sortBy]);

  const openAddModal = () => {
    setEditCategory(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editCategory) {
        return api.put(`/categories/${editCategory.id}`, form);
      }
      return api.post('/categories', form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories']);
      setShowModal(false);
      toast.success(editCategory ? 'Cập nhật thể loại thành công!' : 'Thêm thể loại mới thành công!', { title: 'Thành công' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi lưu thể loại' });
    }
  });

  const handleSave = () => {
    if (!form.name || !form.name.trim()) {
      toast.error('Tên thể loại không được để trống!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.name.length > 100) {
      toast.error('Tên thể loại tối đa 100 ký tự!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.description && form.description.length > 500) {
      toast.error('Mô tả thể loại tối đa 500 ký tự!', { title: 'Lỗi nhập liệu' });
      return;
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories']);
      setConfirmDialog({ isOpen: false });
      toast.success('Đã xóa thể loại thành công!', { title: 'Đã xóa' });
    },
    onError: (err) => {
      setConfirmDialog({ isOpen: false });
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi xóa thể loại' });
    }
  });

  const handleDelete = (cat) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa thể loại',
      message: `Bạn có chắc chắn muốn xóa thể loại "${cat.name}"? Thể loại này hiện tại đang liên kết với ${cat.book_count || 0} cuốn sách. Các sách thuộc thể loại này sẽ bị gỡ liên kết.`,
      confirmText: 'Xóa thể loại',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(cat.id),
    });
  };

  return (
    <div>
      {/* Title & Add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-serif font-semibold text-ink uppercase tracking-wide">Quản lý thể loại sách</h2>
          <p className="text-[10px] text-ink-light tracking-wide mt-0.5">Quản lý phân loại và cấu trúc hiển thị danh mục sách</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-2 px-5 rounded-none transition-colors text-xs uppercase tracking-wider cursor-pointer"
        >
          + Thêm Thể Loại
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-divider border-t-2 border-t-transparent hover:border-t-[#2C4A3B] p-5 transition-all duration-300 hover:shadow-lg hover:shadow-ink/5 flex items-center justify-between group">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-light/80 font-bold font-sans">Tổng số thể loại</div>
            <div className="text-2xl font-serif font-bold text-ink mt-2">
              {stats.total}
              <span className="text-xs font-sans font-normal text-ink-light ml-1">thể loại</span>
            </div>
          </div>
          <div className="p-2 bg-[#faf8f5] border border-divider/40 rounded-none group-hover:bg-[#2C4A3B]/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-[#2C4A3B]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.182 0l5.178-5.178a2.25 2.25 0 0 0 0-3.182L12.018 3.659A2.25 2.25 0 0 0 10.427 3h-.86ZM18.75 8.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-divider border-t-2 border-t-transparent hover:border-t-green-700 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-ink/5 flex items-center justify-between group">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-light/80 font-bold font-sans">Thể loại đang có sách</div>
            <div className="text-2xl font-serif font-bold text-green-700 mt-2">
              {stats.active}
              <span className="text-xs font-sans font-normal text-ink-light ml-1">hoạt động</span>
            </div>
          </div>
          <div className="p-2 bg-[#faf8f5] border border-divider/40 rounded-none group-hover:bg-green-700/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-green-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h3.75a9 9 0 0 1 9 9v3.75a9 9 0 0 1-9 9h-3.75a9 9 0 0 1-9-9v-3.75a9 9 0 0 1 9-9Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-divider border-t-2 border-t-transparent hover:border-t-amber-600 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-ink/5 flex items-center justify-between group">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-light/80 font-bold font-sans">Thể loại rỗng (0 sách)</div>
            <div className="text-2xl font-serif font-bold text-amber-600 mt-2">
              {stats.empty}
              <span className="text-xs font-sans font-normal text-ink-light ml-1">chưa có sách</span>
            </div>
          </div>
          <div className="p-2 bg-[#faf8f5] border border-divider/40 rounded-none group-hover:bg-amber-600/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-amber-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[#faf8f5]/60 border border-divider p-4 rounded-none">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Tìm kiếm thể loại theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-divider rounded-none bg-white text-xs text-ink placeholder-ink-light/60 focus:outline-none focus:border-[#2C4A3B] transition-colors"
          />
          <div className="absolute left-3 top-2.5 text-ink-light/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
            </svg>
          </div>
        </div>
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-divider rounded-none bg-white text-xs text-ink font-semibold focus:outline-none focus:border-[#2C4A3B] transition-colors cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang có sách ({stats.active})</option>
            <option value="EMPTY">Chưa có sách ({stats.empty})</option>
          </select>
        </div>
        <div className="w-full md:w-44">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-divider rounded-none bg-white text-xs text-ink font-semibold focus:outline-none focus:border-[#2C4A3B] transition-colors cursor-pointer"
          >
            <option value="NAME_ASC">Tên thể loại (A-Z)</option>
            <option value="BOOKS_DESC">Số lượng sách (Nhiều nhất)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-divider shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-xs tracking-wider font-semibold">
              <tr>
                <th className="text-left py-3 px-4 w-20">ID</th>
                <th className="text-left py-3 px-4 w-1/4">Tên Thể Loại</th>
                <th className="text-center py-3 px-4 w-36">Số lượng sách</th>
                <th className="text-left py-3 px-4">Mô Tả</th>
                <th className="text-center py-3 px-4 w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {filteredCategories?.map(cat => (
                <tr key={cat.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="py-3 px-4 text-ink-light font-mono text-xs">#{cat.id}</td>
                  <td className="py-3 px-4 font-serif font-medium text-ink">{cat.name}</td>
                  <td className="py-3 px-4 text-center">
                    {(cat.book_count || 0) > 0 ? (
                      <button
                        onClick={() => setSelectedCategoryForBooks(cat)}
                        className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-[#2C4A3B]/10 text-[#2C4A3B] border border-[#2C4A3B]/20 hover:bg-[#2C4A3B]/20 hover:border-[#2C4A3B]/30 transition-all rounded-none cursor-pointer"
                        title="Click để xem danh sách sách thuộc thể loại này"
                      >
                        {cat.book_count} cuốn
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/50">
                        0 cuốn (Trống)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-ink-light text-xs max-w-md truncate">
                    {cat.description ? cat.description : <span className="text-ink-light/50 italic">(Không có mô tả)</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-xs transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                      {isAdmin ? (
                        <button
                          onClick={() => handleDelete(cat)}
                          disabled={deleteMutation.isPending}
                          className="border border-red-200 hover:bg-red-50 text-red-700 font-medium py-1 px-3 rounded-none text-xs transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      ) : (
                        <span className="text-[10px] text-ink-light/40 italic py-1 px-3">Chỉ Admin</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories?.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-ink-light italic">Không tìm thấy thể loại nào phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal form Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-sm">
          <div className="bg-white rounded-none border border-divider shadow-none w-full max-w-md text-ink">
            <div className="flex justify-between items-center px-6 py-4 border-b border-divider">
              <h3 className="font-serif font-semibold text-lg text-ink uppercase tracking-wider">
                {editCategory ? 'Cập Nhật Thể Loại' : 'Thêm Thể Loại Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-light hover:text-ink text-lg leading-none cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Tên thể loại *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs"
                  placeholder="Ví dụ: Lịch sử, Tiểu thuyết, Khoa học..."
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows="4"
                  className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs resize-none"
                  placeholder="Mô tả ngắn về thể loại sách này..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-divider/50">
                <button
                  onClick={() => setShowModal(false)}
                  className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-2 px-4 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-2 px-6 rounded-none text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Lại'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />

      {/* Modal xem danh sách sách thuộc thể loại */}
      {selectedCategoryForBooks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-sm animate-fadeIn">
          <div className="bg-white rounded-none border border-divider shadow-none w-full max-w-2xl text-ink">
            <div className="flex justify-between items-center px-6 py-4 border-b border-divider">
              <div>
                <h3 className="font-serif font-semibold text-base text-ink uppercase tracking-wider">
                  Sách thuộc thể loại: {selectedCategoryForBooks.name}
                </h3>
                <p className="text-[10px] text-ink-light tracking-wide mt-0.5">
                  Đang hiển thị {selectedCategoryForBooks.book_count || 0} cuốn sách liên kết
                </p>
              </div>
              <button 
                onClick={() => setSelectedCategoryForBooks(null)} 
                className="text-ink-light hover:text-ink text-lg leading-none cursor-pointer p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {loadingBooks ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#2C4A3B] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-ink-light italic">Đang tải danh sách sách...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryBooks.length === 0 ? (
                    <p className="text-center py-8 text-ink-light italic text-xs">Thể loại này chưa có cuốn sách nào.</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto divide-y divide-divider border border-divider">
                      {categoryBooks.map(book => {
                        const bookCover = book.cover_url ? getImageUrl(book.cover_url) : 'https://cdn-icons-png.flaticon.com/512/330/330732.png';
                        const statusBadge = {
                          PUBLISHED: 'border-green-200 text-green-700 bg-green-50/50',
                          DRAFT:     'border-amber-200 text-amber-700 bg-amber-50/50',
                          HIDDEN:    'border-red-200 text-red-600 bg-red-50/50',
                        }[book.status] || 'border-divider text-ink-light bg-surface-subtle';
                        const statusLabel = { PUBLISHED: 'Công khai', DRAFT: 'Bản nháp', HIDDEN: 'Ẩn' }[book.status] || book.status;

                        return (
                          <div key={book.id} className="flex items-center gap-4 p-3 hover:bg-[#fcfbf9] transition-colors">
                            {/* Bìa sách */}
                            <div className="w-10 aspect-[3/4] border border-divider bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img src={bookCover} alt="Bìa" className="w-full h-full object-cover" />
                            </div>
                            
                            {/* Chi tiết sách */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif font-semibold text-xs text-ink truncate">{book.title}</h4>
                              <p className="text-[10px] text-ink-light mt-0.5 truncate">Tác giả: {book.author}</p>
                            </div>

                            {/* Trạng thái */}
                            <div className="flex-shrink-0">
                              <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 border rounded-none uppercase tracking-wider ${statusBadge}`}>
                                {statusLabel}
                              </span>
                            </div>

                            {/* Giá bán */}
                            <div className="text-right flex-shrink-0 min-w-[70px]">
                              <span className="font-mono text-xs font-semibold text-ink">
                                {Number(book.price).toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-divider/50">
                <button
                  onClick={() => setSelectedCategoryForBooks(null)}
                  className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-2 px-6 rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Đóng Hộp Thoại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Tab Quản lý Mã giảm giá ────────────────────────────────
function CouponManagerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'PERCENT',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    usage_limit: '100',
    is_active: true
  });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  // Fetch danh sách mã giảm giá
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: () => api.get('/coupons').then(r => r.data.data || [])
  });

  const openAddModal = () => {
    setEditCoupon(null);
    setForm({
      code: '',
      discount_type: 'PERCENT',
      discount_value: '',
      min_order_amount: '0',
      max_discount_amount: '',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      usage_limit: '100',
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (cpn) => {
    setEditCoupon(cpn);
    setForm({
      code: cpn.code,
      discount_type: cpn.discount_type,
      discount_value: cpn.discount_value,
      min_order_amount: cpn.min_order_amount,
      max_discount_amount: cpn.max_discount_amount || '',
      start_date: new Date(cpn.start_date).toISOString().slice(0, 16),
      end_date: new Date(cpn.end_date).toISOString().slice(0, 16),
      usage_limit: cpn.usage_limit,
      is_active: cpn.is_active
    });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount || 0),
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        usage_limit: Number(form.usage_limit)
      };
      if (editCoupon) {
        return api.put(`/coupons/${editCoupon.id}`, payload);
      }
      return api.post('/coupons', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCoupons']);
      setShowModal(false);
      toast.success(editCoupon ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá mới thành công!', { title: 'Thành công' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi lưu mã giảm giá' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/coupons/${id}/toggle`, { is_active }),
    onSuccess: (resData) => {
      queryClient.invalidateQueries(['adminCoupons']);
      toast.success(resData.data.message || 'Cập nhật trạng thái thành công!', { title: 'Thành công' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi cập trạng thái' });
    }
  });

  const handleSave = () => {
    if (!form.code || !form.code.trim()) {
      toast.error('Mã giảm giá không được để trống!', { title: 'Lỗi nhập liệu' });
      return;
    }
    const cleanCode = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(cleanCode)) {
      toast.error('Mã giảm giá chỉ được chứa chữ cái in hoa và số, không khoảng trắng hay ký tự đặc biệt!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (!form.discount_value || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) {
      toast.error('Giá trị giảm phải là số lớn hơn 0!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.discount_type === 'PERCENT' && Number(form.discount_value) > 100) {
      toast.error('Phần trăm giảm giá tối đa là 100%!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.min_order_amount && (isNaN(Number(form.min_order_amount)) || Number(form.min_order_amount) < 0)) {
      toast.error('Đơn hàng tối thiểu không được âm!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.max_discount_amount && (isNaN(Number(form.max_discount_amount)) || Number(form.max_discount_amount) < 0)) {
      toast.error('Mức giảm tối đa không được âm!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (!form.start_date || !form.end_date) {
      toast.error('Vui lòng nhập ngày bắt đầu và ngày kết thúc!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (new Date(form.start_date) >= new Date(form.end_date)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (!form.usage_limit || isNaN(Number(form.usage_limit)) || Number(form.usage_limit) < 0) {
      toast.error('Giới hạn lượt dùng phải là số lớn hơn hoặc bằng 0!', { title: 'Lỗi nhập liệu' });
      return;
    }

    // Gán mã code viết hoa
    form.code = cleanCode;
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCoupons']);
      toast.success('Đã xóa mã giảm giá thành công!', { title: 'Đã xóa' });
      setConfirmDialog({ isOpen: false });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi xóa mã giảm giá' });
      setConfirmDialog({ isOpen: false });
    }
  });

  const handleDelete = (cpn) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa mã giảm giá',
      message: `Bạn có chắc chắn muốn xóa mã giảm giá "${cpn.code}"? Các đơn hàng đã áp dụng mã này vẫn giữ nguyên thông tin giảm giá.`,
      confirmText: 'Xóa mã',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(cpn.id),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-serif font-semibold text-ink">Quản lý mã giảm giá ({coupons?.length || 0})</h2>
        <button
          onClick={openAddModal}
          className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-2 px-5 rounded-none transition-colors text-xs uppercase tracking-wider"
        >
          + Tạo Mã Giảm Giá
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-divider shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="text-left py-3 px-4 w-28">Mã</th>
                <th className="text-left py-3 px-4 w-24">Loại Giảm</th>
                <th className="text-right py-3 px-4 w-28">Giá Trị Giảm</th>
                <th className="text-right py-3 px-4 w-32">Đơn Tối Thiểu</th>
                <th className="text-center py-3 px-4 w-32">Lượt Dùng (Đã dùng/Tổng)</th>
                <th className="text-left py-3 px-4 w-48">Hạn Dùng</th>
                <th className="text-center py-3 px-4 w-28">Trạng thái</th>
                <th className="text-center py-3 px-4 w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {coupons?.map(cpn => {
                const isActive = cpn.is_active;
                const isExpired = new Date(cpn.end_date) < new Date();
                const isLimitReached = Number(cpn.used_count || 0) >= Number(cpn.usage_limit);

                return (
                  <tr key={cpn.id} className={`hover:bg-[#fcfbf9] transition-colors ${!isActive || isExpired ? 'bg-surface-subtle/40 opacity-75' : ''}`}>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs uppercase tracking-wider bg-[#faf8f5] text-[#2C4A3B] border border-[#2C4A3B]/30 px-2 py-0.5 rounded-none">
                        {cpn.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-ink-light">
                      {cpn.discount_type === 'PERCENT' ? 'Phần trăm (%)' : 'Cố định (đ)'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold font-mono text-xs text-ink">
                      {cpn.discount_type === 'PERCENT' 
                        ? `${Number(cpn.discount_value)}%` 
                        : `${Number(cpn.discount_value).toLocaleString('vi-VN')} đ`
                      }
                      {cpn.discount_type === 'PERCENT' && cpn.max_discount_amount && (
                        <div className="text-[9px] text-ink-light font-sans font-normal">Tối đa: {Number(cpn.max_discount_amount).toLocaleString('vi-VN')} đ</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-ink-light">
                      {Number(cpn.min_order_amount) > 0 
                        ? `${Number(cpn.min_order_amount).toLocaleString('vi-VN')} đ` 
                        : '0 đ'
                      }
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-ink">
                      <span className={isLimitReached ? 'text-red-600 font-semibold' : ''}>
                        {cpn.used_count || 0}
                      </span>
                      <span className="text-ink-light/55 mx-0.5">/</span>
                      <span className="text-ink-light">{cpn.usage_limit}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-light leading-relaxed">
                      <div className="text-[10px]">Từ: {new Date(cpn.start_date).toLocaleDateString('vi-VN')} {new Date(cpn.start_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] font-semibold">Đến: {new Date(cpn.end_date).toLocaleDateString('vi-VN')} {new Date(cpn.end_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                      {isExpired && <span className="inline-block text-[8px] font-bold border border-red-200 text-red-600 bg-red-50 px-1 py-0 rounded-none uppercase tracking-wider mt-0.5">Hết hạn</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleMutation.mutate({ id: cpn.id, is_active: !isActive })}
                        disabled={toggleMutation.isPending}
                        className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 border rounded-none uppercase tracking-wider transition-all ${
                          isActive 
                            ? 'border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100/50' 
                            : 'border-divider text-ink-light bg-surface-subtle hover:bg-divider-lt'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-ink-light'}`} />
                        {isActive ? 'Hoạt động' : 'Tạm tắt'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(cpn)}
                          className="border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-xs transition-colors"
                        >
                          Sửa
                        </button>
                        {isAdmin ? (
                          <button
                            onClick={() => handleDelete(cpn)}
                            disabled={deleteMutation.isPending}
                            className="border border-red-200 hover:bg-red-50 text-red-700 font-medium py-1 px-3 rounded-none text-xs transition-colors"
                          >
                            Xóa
                          </button>
                        ) : (
                          <span className="text-[10px] text-ink-light/40 italic py-1 px-3">Chỉ Admin</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {coupons?.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-ink-light italic">Chưa có mã giảm giá nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-sm">
          <div className="bg-white rounded-none border border-divider shadow-none w-full max-w-lg text-ink overflow-y-auto max-h-[92vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-divider">
              <h3 className="font-serif font-semibold text-lg text-ink uppercase tracking-wider">
                {editCoupon ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-light hover:text-ink text-lg leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Mã code *</label>
                  <input
                    type="text"
                    value={form.code}
                    disabled={!!editCoupon}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-mono uppercase disabled:opacity-50 disabled:bg-[#f0ece7]"
                    placeholder="Ví dụ: UUDAI20K"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Loại giảm giá *</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm(f => ({ ...f, discount_type: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (đ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Giá trị giảm *</label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm(f => ({ ...f, discount_value: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-mono"
                    placeholder={form.discount_type === 'PERCENT' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 20000 (đ)'}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Giảm tối đa (đ)</label>
                  <input
                    type="number"
                    value={form.max_discount_amount}
                    disabled={form.discount_type === 'FIXED'}
                    onChange={(e) => setForm(f => ({ ...f, max_discount_amount: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-mono disabled:opacity-50 disabled:bg-[#f0ece7]"
                    placeholder="Chỉ áp dụng khi giảm theo %"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Đơn hàng tối thiểu (đ)</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-mono"
                    placeholder="Ví dụ: 150000"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Giới hạn lượt dùng *</label>
                  <input
                    type="number"
                    value={form.usage_limit}
                    onChange={(e) => setForm(f => ({ ...f, usage_limit: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-mono"
                    placeholder="Ví dụ: 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cpn_is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded-none border-divider text-[#2C4A3B] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="cpn_is_active" className="text-xs text-ink font-semibold uppercase tracking-wider cursor-pointer">Kích hoạt mã ngay lập tức</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-divider/50">
                <button
                  onClick={() => setShowModal(false)}
                  className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-2 px-4 rounded-none text-xs uppercase tracking-wider transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-2 px-6 rounded-none text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Lại'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
}

// ─── Sub-component: Tab Quản lý Bài viết ────────────────────────────────────
function ArticleManagerTab() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [showModal, setShowModal] = useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    cover_url: '',
    category: 'Chiêm nghiệm',
    reading_time: '5 phút đọc',
    status: 'PUBLISHED'
  });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Fetch danh sách bài viết (adminMode=true)
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['adminArticles'],
    queryFn: () => api.get('/articles?limit=200&adminMode=true').then(r => r.data)
  });
  const articles = responseData?.data || [];

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File ảnh quá lớn! Tối đa 5MB.', { title: 'Lỗi tải ảnh' });
      return;
    }

    const formData = new FormData();
    formData.append('cover', file);

    setUploadingCover(true);
    try {
      const response = await api.post('/upload/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const { url } = response.data.data;
      setForm(f => ({ ...f, cover_url: url }));
      toast.success('Tải ảnh bìa lên thành công!', { title: 'Thành công' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Có lỗi xảy ra khi tải ảnh lên';
      toast.error(errMsg, { title: 'Lỗi tải ảnh' });
    } finally {
      setUploadingCover(false);
    }
  };

  const openAddModal = () => {
    setEditArticle(null);
    setForm({
      title: '',
      summary: '',
      content: '',
      cover_url: '',
      category: 'Chiêm nghiệm',
      reading_time: '5 phút đọc',
      status: 'PUBLISHED'
    });
    setShowUrlInput(false);
    setShowModal(true);
  };

  const openEditModal = (article) => {
    setEditArticle(article);
    setForm({
      title: article.title,
      summary: article.summary || '',
      content: article.content || '',
      cover_url: article.cover_url || '',
      category: article.category || 'Chiêm nghiệm',
      reading_time: article.reading_time || '5 phút đọc',
      status: article.status || 'PUBLISHED'
    });
    setShowUrlInput(!!article.cover_url && (article.cover_url.startsWith('http://') || article.cover_url.startsWith('https://')));
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        title: form.title.trim(),
        content: form.content.trim(),
        summary: form.summary.trim()
      };
      if (editArticle) {
        return api.put(`/articles/${editArticle.id}`, payload);
      }
      return api.post('/articles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminArticles']);
      setShowModal(false);
      toast.success(editArticle ? 'Cập nhật bài viết thành công!' : 'Thêm bài viết mới thành công!', { title: 'Thành công' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi lưu bài viết' });
    }
  });

  const handleSave = () => {
    if (!form.title || !form.title.trim()) {
      toast.error('Tiêu đề không được để trống!', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (form.title.trim().length > 255) {
      toast.error('Tiêu đề quá dài! Tối đa 255 ký tự.', { title: 'Lỗi nhập liệu' });
      return;
    }
    if (!form.content || !form.content.trim()) {
      toast.error('Nội dung bài viết không được để trống!', { title: 'Lỗi nhập liệu' });
      return;
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminArticles']);
      toast.success('Đã xóa bài viết thành công!', { title: 'Đã xóa' });
      setConfirmDialog({ isOpen: false });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi xóa bài viết' });
      setConfirmDialog({ isOpen: false });
    }
  });

  const handleDelete = (article) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa bài viết',
      message: `Bạn có chắc chắn muốn xóa bài viết "${article.title}"? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa bài viết',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(article.id),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-serif font-semibold text-ink">Quản lý bài viết ({articles.length} bài)</h2>
        <button
          onClick={openAddModal}
          className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-2 px-5 rounded-none transition-colors text-xs uppercase tracking-wider"
        >
          + Thêm Bài Viết Mới
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-subtle animate-pulse rounded-none" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-none border border-divider shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-surface-warm text-ink-light border-b border-divider uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="text-left py-3 px-4 w-16">ID</th>
                <th className="text-left py-3 px-4 w-24">Ảnh bìa</th>
                <th className="text-left py-3 px-4">Tiêu đề</th>
                <th className="text-left py-3 px-4 w-36">Chuyên mục</th>
                <th className="text-left py-3 px-4 w-28">T.gian đọc</th>
                <th className="text-center py-3 px-4 w-28">Trạng thái</th>
                <th className="text-center py-3 px-4 w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {articles.map(article => {
                const isPublished = article.status === 'PUBLISHED';
                const isDraft = article.status === 'DRAFT';
                return (
                  <tr key={article.id} className="hover:bg-[#fcfbf9] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-ink-light">{article.id}</td>
                    <td className="py-3 px-4">
                      {article.cover_url ? (
                        <img
                          src={getImageUrl(article.cover_url)}
                          alt=""
                          className="w-16 h-10 object-cover rounded-md border border-divider-lt"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-stone-100 flex items-center justify-center text-[10px] text-stone-400 rounded-md border border-dashed border-divider-lt">
                          Không ảnh
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-ink leading-normal max-w-xs truncate">
                      {article.title}
                    </td>
                    <td className="py-3 px-4 text-xs text-ink-light font-medium">{article.category}</td>
                    <td className="py-3 px-4 text-xs text-ink-light font-mono">{article.reading_time}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 border rounded-none uppercase tracking-wider ${
                        isPublished
                          ? 'border-green-200 text-green-700 bg-green-50/50'
                          : isDraft
                          ? 'border-yellow-200 text-yellow-700 bg-yellow-50/50'
                          : 'border-divider text-ink-light bg-surface-subtle'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isPublished ? 'bg-green-500' : isDraft ? 'bg-yellow-500' : 'bg-ink-light'
                        }`} />
                        {isPublished ? 'Công khai' : isDraft ? 'Bản nháp' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(article)}
                          className="border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-xs transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(article)}
                          disabled={deleteMutation.isPending}
                          className="border border-red-200 hover:bg-red-50 text-red-700 font-medium py-1 px-3 rounded-none text-xs transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {articles.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-ink-light italic">Chưa có bài viết nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Thêm/Sửa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-sm">
          <div className="bg-white rounded-none border border-divider shadow-none w-full max-w-4xl text-ink overflow-y-auto max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-divider bg-white sticky top-0 z-10">
              <h3 className="font-serif font-semibold text-lg text-ink uppercase tracking-wider">
                {editArticle ? 'Cập Nhật Bài Viết' : 'Viết Bài Mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-light hover:text-ink text-lg leading-none">✕</button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Meta-information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Tiêu đề bài viết *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs"
                      placeholder="Ví dụ: Nghệ thuật đọc chậm trong kỷ nguyên số..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Chuyên mục *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs"
                      >
                        <option value="Chiêm nghiệm">Chiêm nghiệm</option>
                        <option value="Gợi ý tuyển đọc">Gợi ý tuyển đọc</option>
                        <option value="Kinh nghiệm">Kinh nghiệm</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Thời gian đọc</label>
                      <input
                        type="text"
                        value={form.reading_time}
                        onChange={(e) => setForm(f => ({ ...f, reading_time: e.target.value }))}
                        className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs"
                        placeholder="Ví dụ: 5 phút đọc"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Trạng thái hiển thị *</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs"
                    >
                      <option value="PUBLISHED">Công khai (Published)</option>
                      <option value="DRAFT">Bản nháp (Draft)</option>
                      <option value="HIDDEN">Tạm ẩn (Hidden)</option>
                    </select>
                  </div>

                  {/* Ảnh bìa */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold">Ảnh bìa bài viết</label>
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        className="text-[10px] text-[#2C4A3B] hover:underline uppercase font-bold"
                      >
                        {showUrlInput ? 'Tải ảnh từ máy' : 'Dán URL trực tiếp'}
                      </button>
                    </div>

                    {showUrlInput ? (
                      <input
                        type="text"
                        value={form.cover_url}
                        onChange={(e) => setForm(f => ({ ...f, cover_url: e.target.value }))}
                        className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-mono"
                        placeholder="Dán link ảnh (Unsplash, Imgur, v.v.)"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <label className="flex-grow flex items-center justify-center border border-dashed border-divider hover:border-ink py-2 px-3 cursor-pointer transition-colors bg-[#faf8f5]">
                          <span className="text-xs text-stone-500 font-medium">
                            {uploadingCover ? 'Đang tải lên...' : form.cover_url ? 'Thay đổi ảnh bìa' : 'Chọn ảnh từ thiết bị'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            disabled={uploadingCover}
                            className="hidden"
                          />
                        </label>
                        {form.cover_url && (
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, cover_url: '' }))}
                            className="text-red-600 hover:text-red-800 text-xs font-bold px-2 py-1"
                          >
                            Xóa ảnh
                          </button>
                        )}
                      </div>
                    )}

                    {/* Preview ảnh bìa */}
                    {form.cover_url && (
                      <div className="mt-3 aspect-[16/9] overflow-hidden rounded-md border border-divider-lt relative bg-stone-50">
                        <img
                          src={getImageUrl(form.cover_url)}
                          alt="Ảnh bìa bài viết preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Tóm tắt & Nội dung */}
                <div className="space-y-4 flex flex-col h-full">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Tóm tắt ngắn</label>
                    <textarea
                      value={form.summary}
                      onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))}
                      rows={3}
                      className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs resize-none"
                      placeholder="Nhập tóm tắt ngắn của bài viết hiển thị ở trang chủ danh sách..."
                    />
                  </div>

                  <div className="flex-grow flex flex-col">
                    <label className="block text-xs uppercase tracking-wider text-ink-light font-semibold mb-2">Nội dung chi tiết *</label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                      className="w-full border border-divider rounded-none py-2 px-3 focus:outline-none focus:border-ink bg-white text-ink text-xs font-sans flex-grow min-h-[250px] resize-y"
                      placeholder="Nhập nội dung bài viết chi tiết..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-divider bg-white sticky bottom-0 z-10">
              <button
                onClick={() => setShowModal(false)}
                className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-2 px-4 rounded-none text-xs uppercase tracking-wider transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-semibold py-2 px-6 rounded-none text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Đang lưu...' : 'Đăng Bài Viết'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
}

// ─── Trang chính: Admin Dashboard ─────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'TỔNG QUAN' },
  { id: 'books', label: 'QUẢN LÝ SÁCH' },
  { id: 'articles', label: 'QUẢN LÝ BÀI VIẾT' },
  { id: 'categories', label: 'QUẢN LÝ THỂ LOẠI' },
  { id: 'inventory', label: 'QUẢN LÝ KHO' },
  { id: 'orders', label: 'ĐƠN HÀNG' },
  { id: 'coupons', label: 'MÃ GIẢM GIÁ' },
  { id: 'users', label: 'NGƯỜI DÙNG' },
  { id: 'rag', label: 'VECTOR HÓA RAG' },
];


export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth(); // Lấy user hiện tại

  // Lọc tab dựa trên quyền
  const visibleTabs = TABS.filter(tab => {
    if (tab.id === 'users' && user?.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex-grow w-full">
      {/* Header */}
      <div className="mb-10 border-b border-divider pb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-ink uppercase tracking-widest relative inline-block">
          BẢNG QUẢN TRỊ
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-[#2C4A3B]"></span>
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-8 border-b border-divider pb-0 overflow-x-auto hide-scrollbar relative z-0">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 px-5 font-semibold text-[10px] uppercase tracking-widest transition-all rounded-none -mb-[1px] relative cursor-pointer border-t border-l border-r ${
              activeTab === tab.id
                ? 'bg-white text-[#2C4A3B] border-t-2 border-t-[#2C4A3B] border-x-divider border-b-transparent z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] font-bold'
                : 'bg-[#faf8f5] text-stone-500 hover:text-stone-900 border-transparent border-b-divider hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-none border border-divider p-8 min-h-96 shadow-none">
        {activeTab === 'overview'    && <DashboardOverviewTab />}
        {activeTab === 'books'       && <BookManagerTab />}
        {activeTab === 'articles'    && <ArticleManagerTab />}
        {activeTab === 'categories'  && <CategoryManagerTab />}
        {activeTab === 'inventory'   && <InventoryManagerTab />}
        {activeTab === 'orders'      && <OrderManagerTab />}
        {activeTab === 'coupons'     && <CouponManagerTab />}
        {activeTab === 'users'       && <UserManagerTab />}
        {activeTab === 'rag'         && <RAGIndexerTab />}
      </div>
    </div>
  );
}
