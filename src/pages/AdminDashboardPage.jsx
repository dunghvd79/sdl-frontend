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
        <h2 className="text-lg font-serif font-semibold text-ink">Danh sách sách ({books.length} cuốn)</h2>
        <button
          onClick={openAddModal}
          className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-2 px-5 rounded-none transition-colors text-xs uppercase tracking-wider"
        >
          + Thêm Sách Mới
        </button>
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
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Tên Sách</th>
                <th className="text-left py-3 px-4">Tác Giả</th>
                <th className="text-center py-3 px-4">Trạng thái</th>
                <th className="text-right py-3 px-4">Giá</th>
                <th className="text-center py-3 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {books.map(book => {
                const statusBadge = {
                  PUBLISHED: 'border-green-200 text-green-700 bg-green-50/50',
                  DRAFT:     'border-amber-200 text-amber-700 bg-amber-50/50',
                  HIDDEN:    'border-red-200 text-red-600 bg-red-50/50',
                }[book.status] || 'border-divider text-ink-light bg-surface-subtle';
                const statusLabel = { PUBLISHED: 'Công khai', DRAFT: 'Bản nháp', HIDDEN: 'Ẩn' }[book.status] || book.status;
                return (
                <tr key={book.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="py-3 px-4 text-ink-light font-mono text-xs">#{book.id}</td>
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
                        className="border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-xs transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(book)}
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
            </tbody>
          </table>
          {books.length === 0 && (
            <p className="text-center py-12 text-ink-light italic">Chưa có sách nào trong hệ thống.</p>
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
  // Mỗi dòng có giá trị input và trạng thái (loading/success/error) riêng biệt
  const [editingQty, setEditingQty] = useState({});   // { [bookId]: string }
  const [rowStatus, setRowStatus] = useState({});      // { [bookId]: 'loading'|'success'|'error' }

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

  const handleQtyChange = (bookId, val) => {
    setEditingQty(prev => ({ ...prev, [bookId]: val }));
    // Xóa status cũ khi user bắt đầu nhập lại
    setRowStatus(prev => { const n = { ...prev }; delete n[bookId]; return n; });
  };

  const handleSave = async (bookId, currentAvailableQty) => {
    const rawVal = editingQty[bookId];
    const qty = rawVal !== undefined ? Number(rawVal) : currentAvailableQty;

    if (isNaN(qty) || qty < 0) {
      toast.warning('Số lượng phải là số không âm!', { title: 'Dữ liệu không hợp lệ' });
      return;
    }

    setRowStatus(prev => ({ ...prev, [bookId]: 'loading' }));
    try {
      await api.put(`/inventory/${bookId}`, { availableQty: qty });
      setEditingQty(prev => { const n = { ...prev }; delete n[bookId]; return n; });
      setRowStatus(prev => ({ ...prev, [bookId]: 'success' }));
      queryClient.invalidateQueries(['adminInventory']);
      queryClient.invalidateQueries(['adminInventoryTransactions']);
      toast.success(`Đã cập nhật tồn kho thành công!`, { title: 'Tồn kho' });
      setTimeout(() => {
        setRowStatus(prev => { const n = { ...prev }; delete n[bookId]; return n; });
      }, 2000);
    } catch (err) {
      setRowStatus(prev => ({ ...prev, [bookId]: 'error' }));
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi cập nhật kho' });
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
      <h2 className="text-lg font-serif font-semibold text-ink mb-6">Quản lý tồn kho</h2>
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
              {inventory.map(item => {
                const inputVal = editingQty[item.book_id] !== undefined
                  ? editingQty[item.book_id]
                  : item.available_qty;
                const status = rowStatus[item.book_id];
                const isRowLoading = status === 'loading';

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
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={inputVal}
                          onChange={e => handleQtyChange(item.book_id, e.target.value)}
                          disabled={isRowLoading}
                          className="border border-divider rounded-none px-3 py-1.5 w-20 text-center text-sm focus:outline-none focus:border-ink transition-colors bg-white text-ink disabled:opacity-50"
                        />
                        <button
                          onClick={() => handleSave(item.book_id, item.available_qty)}
                          disabled={isRowLoading}
                          className="min-w-[52px] bg-ink hover:bg-ink-light text-white font-medium py-1.5 px-3 rounded-none text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {isRowLoading ? (
                            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : status === 'success' ? (
                            <span>✓</span>
                          ) : (
                            'Lưu'
                          )}
                        </button>
                        {status === 'success' && (
                          <span className="text-green-600 text-xs font-semibold animate-pulse">Đã lưu!</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inventory.length === 0 && (
            <p className="text-center py-12 text-ink-light italic">Chưa có dữ liệu tồn kho.</p>
          )}
        </div>
      )}

      {/* Nhật ký biến động kho */}
      <div className="mt-12">
        <h3 className="text-md font-serif font-semibold text-ink mb-4">Nhật ký biến động kho</h3>
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
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#fcfbf9] transition-colors text-xs">
                    <td className="py-2.5 px-4 text-ink-light">
                      {new Date(tx.created_at).toLocaleString('vi-VN')}
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
            {transactions.length === 0 && (
              <p className="text-center py-8 text-ink-light italic">Chưa có nhật ký biến động kho nào.</p>
            )}
          </div>
        )}
      </div>
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

  const { data: allOrders, isLoading } = useQuery({
    queryKey: ['adminOrders', dateFilter],
    queryFn: () => api.get(`/admin/orders`, { params: { date: dateFilter } }).then(r => r.data.data)
  });

  const filteredOrders = allOrders?.filter(o => !statusFilter || o.status === statusFilter) || [];
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

  // Summary counts
  const counts = {
    ALL: allOrders?.length || 0,
  };
  PIPELINE.forEach(s => { counts[s] = 0; });
  counts['CANCELLED'] = 0;
  allOrders?.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  return (
    <div>
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

        {/* Date Filter & Options */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3.5 px-4 border border-divider bg-surface-warm/40">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-light">Lọc ngày đặt:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-divider rounded-none py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-ink bg-white text-ink"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs font-semibold text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                Xóa lọc
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date().toLocaleDateString('en-CA');
                setDateFilter(today);
              }}
              className={`text-xs font-bold uppercase tracking-wider px-4 py-2 border transition-all cursor-pointer ${
                dateFilter === new Date().toLocaleDateString('en-CA')
                  ? 'bg-ink text-white border-ink font-bold'
                  : 'bg-white text-ink border-divider hover:bg-surface-warm'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setDateFilter('')}
              className={`text-xs font-bold uppercase tracking-wider px-4 py-2 border transition-all cursor-pointer ${
                !dateFilter
                  ? 'bg-ink text-white border-ink font-bold'
                  : 'bg-white text-ink border-divider hover:bg-surface-warm'
              }`}
            >
              Tất cả ngày
            </button>
          </div>
        </div>

        {/* Active filter chip */}
        {statusFilter && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-light">Đang lọc:</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 border rounded-none ${STEP_COLORS[statusFilter]?.badge}`}>
              {STEP_LABELS[statusFilter]}
              <button onClick={() => setStatusFilter('')} className="hover:opacity-70 leading-none text-sm">✕</button>
            </span>
          </div>
        )}
      </div>

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
                    {/* ID */}
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs text-ink-light font-semibold">#{order.id}</span>
                    </td>

                    {/* Khách hàng */}
                    <td className="py-4 px-4">
                      <div className="font-serif font-semibold text-ink text-sm">{order.full_name}</div>
                      <div className="text-[11px] text-ink-light">{order.email}</div>
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
                          className="w-full border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-[11px] transition-colors uppercase tracking-wider"
                        >
                          Chi tiết
                        </button>

                        {/* Advance to next step */}
                        {!isCancelled && !isDelivered && nextStatus && (
                          <button
                            onClick={() => handleAdvance(order)}
                            disabled={isUpdating}
                            className={`w-full text-white font-bold py-1 px-3 rounded-none text-[11px] transition-colors uppercase tracking-wider disabled:opacity-50 ${STEP_COLORS[nextStatus]?.dot.replace('bg-', 'bg-').replace('-400', '-500').replace('-500', '-600') ? '' : ''} bg-[#2C4A3B] hover:bg-[#1e3529]`}
                          >
                            → {STEP_LABELS[nextStatus]}
                          </button>
                        )}

                        {/* Cancel */}
                        {!isCancelled && !isDelivered && (
                          <button
                            onClick={() => handleCancel(order)}
                            disabled={isUpdating}
                            className="w-full border border-red-200 hover:bg-red-50 text-red-600 font-medium py-1 px-3 rounded-none text-[10px] transition-colors uppercase tracking-wider disabled:opacity-50"
                          >
                            Hủy đơn
                          </button>
                        )}

                        {isDelivered && (
                          <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">✓ Hoàn thành</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-ink-light italic">
                    {dateFilter ? (
                      statusFilter 
                        ? `Không có đơn hàng nào ở trạng thái "${STEP_LABELS[statusFilter] || statusFilter}" trong ngày ${new Date(dateFilter).toLocaleDateString('vi-VN')}.`
                        : `Không có đơn hàng nào trong ngày ${new Date(dateFilter).toLocaleDateString('vi-VN')}.`
                    ) : (
                      statusFilter 
                        ? `Không có đơn hàng nào ở trạng thái "${STEP_LABELS[statusFilter] || statusFilter}".`
                        : 'Chưa có đơn hàng nào.'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-none border border-divider shadow-none w-full max-w-2xl overflow-y-auto max-h-[92vh] text-ink">
            {/* Modal Header */}
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
                    <div className="flex items-start gap-0 mb-5">
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
                                isActive ? 'text-ink' : isDone ? 'text-ink-light' : 'text-divider'
                              }`}>{STEP_LABELS[step]}</span>
                            </div>
                            {i < PIPELINE.length - 1 && (
                              <div className={`flex-1 h-px mt-4 mx-1 ${i < curIdx ? c.bar : 'bg-divider'}`} />
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
                            className="flex-1 max-w-xs bg-[#2C4A3B] hover:bg-[#1e3529] disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-none text-xs transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
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
                          className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 hover:border-red-400 text-red-500 hover:text-red-700 font-medium py-2.5 px-4 rounded-none text-[11px] transition-all uppercase tracking-widest disabled:opacity-50 animate-pulse-once"
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
// ─── Sub-component: Tab Tổng quan Dashboard ───────────────────────────────
function DashboardOverviewTab() {
  const toast = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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

  const maxOrderStatusVal = Math.max(...Object.values(orderStats), 1);
  const maxTopBookVal = Math.max(...topBooks.map(b => Number(b.total_sold)), 1);

  return (
    <div className="space-y-8">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-divider rounded-none p-5 bg-white shadow-none">
          <div className="text-[10px] uppercase tracking-widest text-ink-light font-bold">Tổng doanh thu thực tế</div>
          <div className="text-2xl font-serif font-bold text-[#2C4A3B] mt-2">
            {revenue.toLocaleString('vi-VN')} đ
          </div>
          {discount > 0 && (
            <div className="text-xs text-ink-light/80 mt-1">
              Giảm giá qua Coupon: <span className="font-semibold">-{discount.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
        </div>

        <div className="border border-divider rounded-none p-5 bg-white shadow-none">
          <div className="text-[10px] uppercase tracking-widest text-ink-light font-bold">Tổng số đơn đặt</div>
          <div className="text-2xl font-serif font-bold text-ink mt-2">
            {Object.values(orderStats).reduce((a, b) => a + b, 0)} đơn
          </div>
          <div className="text-xs text-ink-light/80 mt-1 flex gap-2">
            <span className="text-green-600 font-semibold">Đã giao: {orderStats.DELIVERED || 0}</span>
            <span>·</span>
            <span className="text-red-600 font-semibold">Hủy: {orderStats.CANCELLED || 0}</span>
          </div>
        </div>

        <div className="border border-divider rounded-none p-5 bg-white shadow-none">
          <div className="text-[10px] uppercase tracking-widest text-ink-light font-bold">Tổng thành viên</div>
          <div className="text-2xl font-serif font-bold text-ink mt-2">
            {Object.values(userStats).reduce((a, b) => a + b, 0)} người
          </div>
          <div className="text-xs text-ink-light/80 mt-1 flex gap-2">
            <span>Admin: {userStats.ADMIN || 0}</span>
            <span>·</span>
            <span>Curator: {userStats.CURATOR || 0}</span>
            <span>·</span>
            <span>Khách: {userStats.CUSTOMER || 0}</span>
          </div>
        </div>

        <div className="border border-divider rounded-none p-5 bg-white shadow-none">
          <div className="text-[10px] uppercase tracking-widest text-ink-light font-bold">Tiến độ RAG</div>
          <div className="text-2xl font-serif font-bold text-green-700 mt-2">
            {ragStats.total > 0 ? Math.round((ragStats.vectorized / ragStats.total) * 100) : 0}%
          </div>
          <div className="text-xs text-ink-light/80 mt-1">
            Đã vector hóa: <span className="font-semibold text-green-700">{ragStats.vectorized}</span> / {ragStats.total} cuốn
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-divider rounded-none p-6 bg-white shadow-none">
          <h3 className="text-sm font-serif font-bold text-ink uppercase tracking-wider mb-5 border-b border-divider pb-2">
            Top 5 Sách bán chạy nhất
          </h3>
          {topBooks.length === 0 ? (
            <p className="text-center py-12 text-ink-light italic text-xs">Chưa có dữ liệu bán sách.</p>
          ) : (
            <div className="space-y-4">
              {topBooks.map((book, idx) => {
                const pct = (Number(book.total_sold) / maxTopBookVal) * 100;
                return (
                  <div key={book.id} className="space-y-1">
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
            {Object.entries(orderStats).map(([status, count]) => {
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
            Các đơn hàng mới nhất
          </h3>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-1.5 px-4 rounded-none text-xs transition-colors uppercase tracking-wider"
          >
            📊 Xuất Báo Cáo CSV
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-center py-8 text-ink-light italic text-xs">Chưa có đơn hàng nào.</p>
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
                {recentOrders.map(order => (
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
                        className="border border-divider hover:bg-[#f0ece7] text-ink font-semibold py-1 px-2.5 rounded-none text-[10px] transition-colors uppercase tracking-wider"
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

  // Fetch danh mục
  const { data: categories, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => api.get('/categories').then(r => r.data.data || [])
  });

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
      toast.success('Đã xóa thể loại thành công!', { title: 'Đã xóa' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message, { title: 'Lỗi xóa thể loại' });
    }
  });

  const handleDelete = (cat) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa thể loại',
      message: `Bạn có chắc chắn muốn xóa thể loại "${cat.name}"? Các sách thuộc thể loại này sẽ bị gỡ liên kết.`,
      confirmText: 'Xóa thể loại',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(cat.id),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-serif font-semibold text-ink">Quản lý thể loại sách ({categories?.length || 0})</h2>
        <button
          onClick={openAddModal}
          className="bg-[#2C4A3B] hover:bg-[#1e3529] text-white font-medium py-2 px-5 rounded-none transition-colors text-xs uppercase tracking-wider"
        >
          + Thêm Thể Loại
        </button>
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
                <th className="text-left py-3 px-4 w-1/3">Tên Thể Loại</th>
                <th className="text-left py-3 px-4">Mô Tả</th>
                <th className="text-center py-3 px-4 w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-lt">
              {categories?.map(cat => (
                <tr key={cat.id} className="hover:bg-[#fcfbf9] transition-colors">
                  <td className="py-3 px-4 text-ink-light font-mono text-xs">#{cat.id}</td>
                  <td className="py-3 px-4 font-serif font-medium text-ink">{cat.name}</td>
                  <td className="py-3 px-4 text-ink-light text-xs max-w-md truncate">{cat.description || 'Chưa có mô tả'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="border border-divider hover:bg-[#f0ece7] text-ink font-medium py-1 px-3 rounded-none text-xs transition-colors"
                      >
                        Sửa
                      </button>
                      {isAdmin ? (
                        <button
                          onClick={() => handleDelete(cat)}
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
              ))}
              {categories?.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-ink-light italic">Chưa có thể loại nào.</td>
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
              <button onClick={() => setShowModal(false)} className="text-ink-light hover:text-ink text-lg leading-none">✕</button>
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
