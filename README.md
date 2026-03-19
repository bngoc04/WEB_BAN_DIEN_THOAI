# Dự án Web Bán Điện Thoại

Dự án đã được chia thành hai phần riêng biệt: **Frontend** và **Backend**.

## Cấu trúc thư mục
- `/frontend`: Chứa toàn bộ giao diện người dùng (HTML, CSS, JS, hình ảnh).
- `/backend`: Chứa API server và cơ sở dữ liệu (Node.js, Express, db.json).

## Cách khởi chạy

### 1. Khởi chạy Backend
Backend cung cấp API tại địa chỉ `http://localhost:3000`.

```bash
cd backend
npm start
```

### 2. Khởi chạy Frontend
Bạn có thể mở trực tiếp file `frontend/index.html` bằng trình duyệt hoặc sử dụng các công cụ như:
- **VS Code Live Server**: Chuột phải vào `index.html` và chọn "Open with Live Server".
- **Simple HTTP Server**: Nếu máy bạn có Python, chạy `python -m http.server` trong thư mục `frontend`.

## Ghi chú
- Đảm bảo Backend đã được chạy trước khi thao tác trên Frontend để dữ liệu (sản phẩm, đăng nhập) có thể hiển thị chính xác.
- Frontend kết nối tới Backend thông qua URL cố định `http://localhost:3000/api`.
