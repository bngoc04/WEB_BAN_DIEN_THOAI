TechNova là giải pháp thương mại điện tử toàn diện cho lĩnh vực bán lẻ điện thoại di động, được thiết kế với giao diện hiện đại, trải nghiệm người dùng tối ưu và hệ thống quản trị chuyên sâu.

---

## 🌟 Tính năng nổi bật

### 1. Dành cho Khách hàng (Storefront)
- **Tìm kiếm thông minh (Live Search):** Tìm kiếm sản phẩm theo tên, hãng hoặc mô tả ngay lập tức khi đang gõ.
- **Trang chi tiết sản phẩm:** Xem hình ảnh 360 độ, thông tin kỹ thuật chi tiết, video review và đánh giá từ cộng đồng.
- **Hệ thống giỏ hàng:** Thêm, xóa, cập nhật số lượng linh hoạt với hiệu ứng tương tác mượt mà.
- **Đăng ký/Đăng nhập:** Đồng bộ màu sắc thương hiệu, bảo mật thông tin người dùng.
- **Thanh toán (Checkout):** Tích hợp chọn khu vực, áp dụng voucher ưu đãi.
- **Hệ thống Review:** Khách hàng có thể để lại bình luận và đánh giá sao cho sản phẩm.

### 2. Dành cho Nhân viên (Staff Dashboard)
- **Tổng quan (Overview):** Xem biểu đồ trạng thái đơn hàng và doanh thu thời gian thực.
- **Quản lý Đơn hàng:** Xác nhận, cập nhật trạng thái giao hàng nhanh chóng.
- **Quản lý Kho:** Theo dõi tồn kho, cảnh báo các sản phẩm sắp hết hàng.
- **Hỗ trợ khách hàng:** Tiếp nhận và xử lý các Ticket yêu cầu từ khách hàng.

### 3. Dành cho Quản trị viên (Admin Portal)
- **Báo cáo chuyên sâu:** Thống kê doanh thu, số lượng người dùng và sản phẩm.
- **Quản lý danh mục:** Thêm, sửa, xóa các danh mục sản phẩm.
- **Chính sách ưu đãi:** Quản lý Voucher, mã giảm giá toàn hệ thống.
- **Quản lý Nhân sự:** Phân quyền và quản lý tài khoản nhân viên.

---

## 🚀 Công nghệ sử dụng

- **Frontend:**
  - Ngôn ngữ: HTML5, Vanilla JavaScript (ES6+)
  - Styling: CSS3 (Variables, Flexbox, Grid, Animations)
  - Thư viện: Chart.js (Biểu đồ), FontAwesome (Icon), Google Fonts (Outfit)
- **Backend:**
  - Runtime: Node.js
  - Framework: Express.js
  - Database: Microsoft SQL Server (MSSQL)
  - Driver: `mssql`, `msnodesqlv8` (Xác thực Windows)

---

## 📦 Cấu trúc thư mục

```text
/
├── frontend/               # Mã nguồn giao diện (HTML, CSS, JS)
│   ├── images/             # Tài nguyên hình ảnh sản phẩm & UI
│   ├── auth.html           # Trang Đăng nhập/Đăng ký
│   ├── dashboard.html      # Dashboard cho Nhân viên
│   ├── admin.html          # Trang quản trị của Admin
│   └── ...                 
└── backend/                # Mã nguồn API Server
    ├── server.js           # File khởi chạy server chính
    ├── seed_support.js     # Script nạp dữ liệu hỗ trợ
    └── seed_vouchers.js    # Script nạp dữ liệu Voucher
```

---

## 🛠 Hướng dẫn cài đặt

### 1. Thiết lập Cơ sở dữ liệu
- Khởi chạy SQL Server Management Studio (SSMS).
- Tạo database tên: `WebBanDienThoai`.
- Chạy các script SQL để tạo bảng: `Users`, `Products`, `Orders`, `Vouchers`, `Reviews`, `SupportTickets`.

### 2. Cấu hình & Chạy Backend
- Di chuyển vào thư mục backend: `cd backend`
- Cài đặt dependencies: `npm install`
- Khởi chạy server: `npm start` (Mặc định chạy tại port 3000)

### 3. Khởi chạy Frontend
- Sử dụng công cụ `http-server` hoặc VS Code Live Server tại thư mục `frontend`.
- Truy cập qua trình duyệt: `http://localhost:8081` (hoặc port tương ứng).

---

## 🔗 Hệ thống API (Base URL: `http://localhost:3000/api`)

| Phương thức | Endpoint | Mô tả |
|-------------|----------|--------|
| `POST` | `/register` | Đăng ký tài khoản khách hàng mới |
| `POST` | `/login` | Đăng nhập hệ thống |
| `GET` | `/products` | Lấy danh sách toàn bộ sản phẩm |
| `GET` | `/products/:id` | Lấy chi tiết 1 sản phẩm |
| `GET` | `/stats` | Lấy thống kê tổng quan (Admin/Staff) |
| `GET` | `/vouchers` | Lấy danh sách mã giảm giá |
| `GET` | `/support_tickets` | Lấy danh sách yêu cầu hỗ trợ |

---

## 🎨 Thiết kế thương hiệu
- **Màu chủ đạo (TechNova Blue):** `#2563eb`
- **Màu phụ (TechNova Purple):** `#7c3aed`
- **Gradient:** `linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)`
- **Font chữ:** `Outfit` (Premium modern font)

---

## Đăng nhập trang Nhân viên & Quản trị viên
- Thông tin đăng nhập dành cho Nhân viên:
- Email: staff@technova.vn
- Mật khẩu: staff123

- Thông tin đăng nhập dành cho Quản trị viên:
- Email: admin@technova.vn
- Mật khẩu: admin123

2026 TechNova Team. Developed with ❤️ for better shopping experience.
