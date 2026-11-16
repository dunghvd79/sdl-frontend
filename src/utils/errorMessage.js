// B49: lỗi hệ thống (500) từ backend có dạng { error: 'Đã xảy ra lỗi hệ thống...', errorId: '<uuid>' }.
// Nối 8 ký tự đầu của errorId vào câu báo để khách đọc / chụp màn hình gửi cho quản trị;
// quản trị tìm đúng dòng log trên Render bằng chuỗi này (Render Logs tìm theo chuỗi con).
// Các trang đang hiển thị `response.data.error` tự có mã lỗi, không phải sửa từng trang.
export const ERROR_ID_LENGTH = 8;

export function withErrorId(data) {
  if (!data || typeof data.error !== 'string' || typeof data.errorId !== 'string' || !data.errorId) {
    return data;
  }
  const shortId = data.errorId.slice(0, ERROR_ID_LENGTH);
  if (data.error.includes(shortId)) {
    return data; // đã nối rồi (vd request được xử lý lại)
  }
  return { ...data, error: `${data.error} (Mã lỗi: ${shortId})` };
}
