# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Sao chép file cấu hình package
COPY package*.json ./

# Cài đặt toàn bộ dependencies bao gồm cả devDependencies để chạy vite build
RUN npm ci

# Sao chép mã nguồn ứng dụng
COPY . .

# Biên dịch React app (Vite build) sinh ra thư mục /dist
RUN npm run build

# Stage 2: Serve tĩnh bằng Nginx
FROM nginx:alpine

# Sao chép file build từ builder stage sang thư mục root của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Sao chép file cấu hình nginx tùy chỉnh để hỗ trợ SPA Routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose cổng 80 mặc định
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
