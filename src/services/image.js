// Helper utility to construct public URLs for uploaded images
export const getImageUrl = (url) => {
  if (!url) return '';
  // If url is already an absolute web URL or base64 data URI, return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // Extract domain/host from API URL (e.g., http://localhost:3000/api -> http://localhost:3000)
  const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'https://sdl-backend.onrender.com';
  return `${baseUrl}${url}`;
};
