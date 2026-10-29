# GameHub Community 🎮

> **Diễn đàn Gaming Full-Stack Hiện Đại & Tối Giản**  
> Xây dựng bằng **HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js và SQLite**.  
> Hoàn toàn không phụ thuộc vào frontend frameworks hay bundler phức tạp.

---

## 🌟 Tổng quan dự án

**GameHub Community** là nền tảng diễn đàn cộng đồng game thủ hoàn chỉnh, nơi người dùng có thể thảo luận chiến thuật, chia sẻ mẹo chơi game, trao đổi kinh nghiệm và theo dõi các tựa game yêu thích.

### Các tính năng cốt lõi:
1. **Kiến trúc Modern Minimalist Gaming**:
   - Giao diện phẳng, tinh tế, sạch sẽ, không gradient nền nặng nề hay hiệu ứng neon gây chói mắt.
   - Màu xanh dương làm điểm nhấn thương hiệu (Primary Blue: `#2563EB` ở Light Mode, `#3B82F6` ở Dark Mode).
   - Thiết kế đáp ứng (Responsive) 3 cột trên Desktop, chuyển đổi linh hoạt trên Tablet và Mobile với Mobile Drawer.
2. **Chế độ Sáng / Tối (Light Mode & Dark Mode)**:
   - Chuyển đổi mượt mà với 1 nút bấm ở Header.
   - Tự động đồng bộ theo tùy chọn hệ thống (System Preference) và lưu vào `localStorage`.
   - Cơ chế zero-flash theme áp dụng ngay trong `<head>`.
3. **Xác thực & Bảo mật mạnh mẽ**:
   - Mã hóa mật khẩu bằng thuật toán bộ nhớ chuyên dụng `scrypt` (`node:crypto`).
   - Quản lý phiên bằng Session Cookie ký số an toàn (Signed HTTP-Only Cookies) và Bearer Token.
   - Phân quyền 4 cấp độ chặt chẽ ở phía Server: **Guest**, **Member**, **Moderator**, **Admin**.
   - Chống XSS (Sanitize HTML tag whitelist) và Rate Limiting chống spam / brute force.
4. **Hệ thống Bài viết & Tương tác**:
   - CRUD bài viết hoàn chỉnh, tự động tạo SEO Friendly Slug.
   - Bộ lọc Feed: **Mới nhất (Latest)**, **Đang thịnh hành (Trending)**, **Nhiều tương tác (Most Discussed)**.
   - Thích bài viết (Like / Unlike), Lưu bài viết (Bookmark), Đếm lượt xem thực tế.
   - Hệ thống bình luận phân cấp dạng cây (Threaded Comments & Nested Replies).
   - Tải ảnh đính kèm bài viết và ảnh đại diện an toàn qua REST API Upload (`multer`).
5. **Cộng đồng Game & Khám phá**:
   - Danh mục game (Valorant, League of Legends, Minecraft, Cyberpunk 2077, Elden Ring, Genshin Impact...).
   - Tính năng theo dõi game (Follow Game) lưu trữ trong cơ sở dữ liệu.
6. **Trung tâm thông báo (Notifications Center)**:
   - Thông báo theo thời gian thực khi có người bình luận, trả lời hoặc thích bài viết.
   - Huy hiệu (Badge) số lượng chưa đọc tại thanh điều hướng.
7. **Bảng điều khiển Quản trị (Admin & Moderator Dashboard)**:
   - Thống kê toàn diễn đàn (Tổng thành viên, bài viết, bình luận, báo cáo).
   - Xử lý báo cáo vi phạm (Resolve / Dismiss Report).
   - Quản lý phân quyền thành viên và khóa tài khoản (Ban / Activate).
   - Thêm và quản lý cộng đồng game mới.
   - Nhật ký kiểm duyệt (Moderation Audit Logs).

---

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5 Semantic, CSS3 (CSS Variables, Flexbox, CSS Grid), Vanilla JavaScript (ES6+, Fetch API, DOM manipulation).
- **Backend**: Node.js, Express.js (CommonJS, Clean Layered Architecture: routes, controllers, middleware, validators).
- **Cơ sở dữ liệu**: SQLite tích hợp sẵn thông qua Node.js native `node:sqlite` (`DatabaseSync`), chế độ WAL (Write-Ahead Logging) cho hiệu năng cao.
- **Upload**: `multer` với kiểm tra MIME type ảnh (JPEG, PNG, WEBP, GIF) và giới hạn 5MB.

---

## 📁 Cấu trúc thư mục

```
gamehub/
├── public/                     # Frontend tĩnh phục vụ trực tiếp
│   ├── index.html              # Trang chủ diễn đàn & danh sách bài viết
│   ├── games.html              # Trang khám phá cộng đồng game
│   ├── post.html               # Chi tiết bài viết & bình luận phân cấp
│   ├── create-post.html        # Soạn thảo & chỉnh sửa bài viết
│   ├── profile.html            # Hồ sơ thành viên & dấu trang
│   ├── notifications.html      # Trung tâm thông báo
│   ├── login.html              # Đăng nhập
│   ├── register.html           # Đăng ký thành viên
│   ├── admin.html              # Bảng điều khiển quản trị
│   ├── css/
│   │   ├── themes.css          # Design Tokens (Light & Dark theme)
│   │   ├── style.css           # Toàn bộ CSS phong cách Gaming Minimalist
│   │   └── responsive.css      # Responsive media queries (Desktop/Tablet/Mobile)
│   ├── js/
│   │   ├── theme.js            # Theme manager (Light/Dark toggle & storage)
│   │   ├── api.js              # Fetch client wrapper & toast notifications
│   │   ├── main.js             # Header, navbar, mobile drawer
│   │   ├── posts.js            # Feed logic & post cards
│   │   ├── comments.js         # Post details & comments tree
│   │   ├── games.js            # Games explore & follow logic
│   │   ├── profile.js          # User profile logic
│   │   ├── admin.js            # Admin dashboard logic
│   │   └── auth.js             # Auth form handlers
│   └── assets/
│       └── uploads/            # Thư mục lưu ảnh người dùng tải lên
├── src/
│   ├── config/                 # Cấu hình tập trung (Tên thương hiệu, server, upload)
│   ├── controllers/            # Controller xử lý business logic
│   ├── database/               # Schema SQL, kết nối SQLite, seed script
│   ├── middleware/             # Xác thực (Auth), phân quyền (Role), RateLimit, Upload
│   ├── routes/                 # Định nghĩa các REST API endpoints
│   ├── utils/                  # Mã hóa scrypt, session token, XSS sanitize, slug
│   ├── app.js                  # Cấu hình Express app
│   └── server.js               # Điểm khởi chạy HTTP Server
├── tests/
│   └── run.js                  # Bộ test tự động kiểm thử toàn diện
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt và khởi chạy

### 1. Cài đặt Dependencies
Mở terminal tại thư mục dự án và chạy:
```bash
npm install
```

### 2. Cấu hình môi trường (Tùy chọn)
Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
```
Các tham số mặc định:
- `PORT`: 3000
- `NODE_ENV`: development
- `SESSION_SECRET`: chuỗi bí mật mã hóa phiên
- `DB_FILE`: đường dẫn file SQLite `gamehub.db`

### 3. Khởi tạo Cơ sở dữ liệu và Dữ liệu mẫu (Seed Data)
Chạy lệnh khởi tạo dữ liệu cộng đồng (người dùng mẫu, danh mục game, bài viết chi tiết, bình luận phân cấp, thông báo):
```bash
npm run seed
```

### 4. Chạy Test kiểm thử tự động
Chạy test suite kiểm tra toàn bộ xác thực, CRUD bài viết, tương tác thích/lưu, bình luận và phân quyền quản trị:
```bash
npm test
```

### 5. Khởi động Web Server
```bash
npm start
```
Hoặc chế độ phát triển tự động reload khi sửa code:
```bash
npm run dev
```

Truy cập website trên trình duyệt:  
👉 **http://localhost:3000**

---

## 🔑 Tài khoản mẫu thử nghiệm

Hệ thống đã chuẩn bị sẵn các tài khoản với từng vai trò cụ thể:

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123456` | Toàn quyền quản trị, đổi vai trò, khóa tài khoản, thêm game, kiểm duyệt |
| **Moderator** | `mod_gamer` | `Mod@123456` | Xử lý báo cáo vi phạm, ẩn/xóa bài viết vi phạm, xem nhật ký kiểm duyệt |
| **Member** | `pro_ninja` | `Ninja@123456` | Tạo bài, bình luận, like, bookmark, theo dõi game, sửa bài của mình |
| **Member** | `cyber_v` | `Cyber@123456` | Thành viên thảo luận RPG / Cyberpunk |
| **Member** | `pixel_hero` | `Pixel@123456` | Thành viên thảo luận Minecraft & Redstone |

---

## 📡 Danh sách API Endpoints chính

### 1. Xác thực (`/api/auth`)
- `POST /api/auth/register`: Đăng ký tài khoản mới.
- `POST /api/auth/login`: Đăng nhập, cấp Cookie Session và Bearer Token.
- `POST /api/auth/logout`: Đăng xuất và xóa phiên.
- `GET /api/auth/me`: Lấy thông tin tài khoản đang đăng nhập.

### 2. Bài viết (`/api/posts`)
- `GET /api/posts`: Danh sách bài viết (hỗ trợ phân trang `page`, `limit`, tab `latest`/`trending`/`most_discussed`, lọc theo `gameSlug`, tìm kiếm `search`, lọc theo `author`).
- `GET /api/posts/:slug`: Chi tiết bài viết và tăng lượt xem thực tế.
- `POST /api/posts`: Tạo bài viết mới (yêu cầu đăng nhập).
- `PUT /api/posts/:id`: Cập nhật bài viết (tác giả hoặc quản trị viên).
- `DELETE /api/posts/:id`: Xóa bài viết (tác giả hoặc quản trị viên).
- `POST /api/posts/:id/like`: Bật/tắt thích bài viết.
- `POST /api/posts/:id/bookmark`: Bật/tắt lưu bài viết.

### 3. Bình luận (`/api/comments`)
- `GET /api/comments/post/:postId`: Cây bình luận và phản hồi phân cấp.
- `POST /api/comments/post/:postId`: Gửi bình luận hoặc phản hồi (`parentId`).
- `PUT /api/comments/:id`: Sửa bình luận.
- `DELETE /api/comments/:id`: Xóa bình luận.

### 4. Cộng đồng Game (`/api/games`)
- `GET /api/games`: Danh sách game cùng số lượng bài viết và người theo dõi.
- `GET /api/games/:slug`: Thông tin chi tiết một tựa game.
- `POST /api/games/:id/follow`: Theo dõi / bỏ theo dõi game.
- `POST /api/games`: Thêm game mới (Admin).

### 5. Thành viên (`/api/users`)
- `GET /api/users/profile/:username`: Hồ sơ công khai và thống kê hoạt động.
- `PUT /api/users/profile`: Cập nhật tên hiển thị, tiểu sử, avatar.
- `GET /api/users/bookmarks/:username`: Danh sách bài viết đã lưu.
- `GET /api/users/followed-games/:username`: Các game đang theo dõi.

### 6. Thông báo (`/api/notifications`)
- `GET /api/notifications`: Danh sách thông báo tương tác.
- `GET /api/notifications/unread-count`: Số thông báo chưa đọc.
- `PUT /api/notifications/:id/read`: Đánh dấu đã đọc 1 thông báo.
- `PUT /api/notifications/mark-all-read`: Đánh dấu tất cả đã đọc.

### 7. Quản trị (`/api/admin`)
- `GET /api/admin/stats`: Thống kê tổng thể diễn đàn.
- `GET /api/admin/users`: Quản lý danh sách thành viên.
- `PUT /api/admin/users/:id/role`: Nâng cấp / hạ cấp vai trò thành viên.
- `PUT /api/admin/users/:id/status`: Khóa hoặc kích hoạt lại tài khoản.
- `GET /api/admin/reports`: Hàng đợi báo cáo vi phạm.
- `PUT /api/admin/reports/:id`: Xử lý báo cáo (Resolved / Dismissed).
- `GET /api/admin/moderation-logs`: Nhật ký kiểm duyệt.

### 8. Upload File (`/api/upload`)
- `POST /api/upload`: Tải lên ảnh an toàn (hỗ trợ JPEG, PNG, WEBP, GIF tối đa 5MB).

---

## 🔒 Kiểm tra Bảo mật & Tối ưu hóa

- **Mật khẩu an toàn**: Sử dụng thuật toán `scrypt` với muối ngẫu nhiên 16 bytes và độ dài khóa 64 bytes.
- **Phòng chống XSS**: Sanitization các thẻ HTML độc hại trong nội dung người dùng nhập vào.
- **Phòng chống SQL Injection**: 100% câu truy vấn được tham số hóa (Parameterized queries) thông qua Prepared Statements.
- **Kiểm soát Quyền tối thiểu**: Mọi API cập nhật, xóa, sửa hoặc truy cập tài nguyên quản trị đều được xác thực và phân quyền ở phía Server.
- **Chống SPAM**: Giới hạn tần suất request (Rate Limiter) bảo vệ các endpoint xác thực và API.
