# HealthTips Admin - Hệ thống quản trị ứng dụng mẹo sức khỏe

## 🎯 Tổng quan

Đây là hệ thống quản trị web cho ứng dụng mẹo sức khỏe, được xây dựng dựa trên cấu trúc dữ liệu Firebase thực tế. Hệ thống cung cấp đầy đủ các chức năng quản lý nội dung, người dùng, phân tích và cấu hình hệ thống.

## 🚀 Các tính năng chính

### 1. 📊 Dashboard
- Thống kê tổng quan về người dùng, nội dung, lượt xem
- Biểu đồ phân tích lượt xem theo thời gian
- Hoạt động gần đây của người dùng
- Trạng thái hệ thống (Firebase, Cloudinary, Notifications)

### 2. 📝 Quản lý nội dung (Content Management)
- **CRUD bài viết sức khỏe**: Tạo, sửa, xóa, xuất bản bài viết
- **Quản lý danh mục**: Phân loại nội dung theo chủ đề
- **Tính năng nổi bật**: Đặt bài viết làm nổi bật
- **Bộ lọc và tìm kiếm**: Lọc theo danh mục, trạng thái, tác giả
- **Thao tác hàng loạt**: Xuất bản, ẩn, xóa nhiều bài viết cùng lúc
- **Xuất dữ liệu**: Export danh sách bài viết ra JSON

### 3. 👥 Quản lý người dùng
- **Danh sách người dùng**: Xem tất cả người dùng trong hệ thống
- **Phân quyền**: Admin, Editor, Moderator, Analyst, Viewer
- **Thông tin chi tiết**: Lịch sử hoạt động, thống kê cá nhân
- **Khóa/Kích hoạt**: Quản lý trạng thái tài khoản
- **Thống kê**: Người dùng mới, người dùng hoạt động

### 4. 🎥 Quản lý Video
- **Danh sách video**: Hiển thị tất cả video với thumbnail
- **Upload video**: Kéo thả hoặc chọn file để tải lên
- **Trạng thái xử lý**: Processing, Published, Failed
- **Phân loại**: Gán video vào danh mục
- **Thống kê**: Lượt xem, lượt thích cho từng video

### 5. 📈 Phân tích dữ liệu (Analytics)
- **Hoạt động người dùng**: Đăng nhập, xem trang theo thời gian
- **Nội dung phổ biến**: Top bài viết được xem nhiều nhất
- **Phân tích danh mục**: Phân bố nội dung theo chủ đề
- **Thiết bị truy cập**: Desktop, Mobile, Tablet
- **Xuất báo cáo**: Export dữ liệu phân tích

### 6. ⚙️ Cấu hình hệ thống
- **Kết nối dịch vụ**: Firebase, Cloudinary
- **Feature Flags**: Bật/tắt các tính năng
- **Thông tin ứng dụng**: Tên, phiên bản, mô tả
- **Mẫu thông báo**: Email, Push notification
- **Trạng thái hệ thống**: Monitoring các dịch vụ

## 🛠️ Công nghệ sử dụng

- **Framework**: Next.js 14 với TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Database**: Firebase Realtime Database
- **Storage**: Cloudinary cho media files
- **Charts**: Chart.js với react-chartjs-2
- **Data Grid**: MUI X Data Grid
- **File Upload**: React Dropzone
- **Authentication**: Firebase Auth

## 📱 Cấu trúc dữ liệu Firebase

Hệ thống được thiết kế dựa trên cấu trúc dữ liệu Firebase thực tế:

```
reminderwater-84694-default-rtdb/
├── analytics/          # Dữ liệu phân tích người dùng
├── categories/         # Danh mục nội dung
├── health_tips/        # Bài viết sức khỏe
├── videos/            # Video ngắn
├── users/             # Thông tin người dùng
├── reminders/         # Nhắc nhở của người dùng
├── favorites/         # Bài viết yêu thích
├── conversations/     # Tin nhắn hỗ trợ
├── searchHistories/   # Lịch sử tìm kiếm
└── userPreferences/   # Cài đặt cá nhân
```

## 🔧 Cài đặt và chạy

### 1. Clone project
```bash
git clone <repository-url>
cd healthtips-admin
```

### 2. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

### 3. Cấu hình môi trường
Tạo file `.env.local` với nội dung:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAXWk6glK6hpXQkiunvydjFNtM56yxwN_w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=reminderwater-84694.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DB_URL=https://reminderwater-84694-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=reminderwater-84694
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=reminderwater-84694.appspot.com

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dazo6ypwt
CLOUDINARY_API_KEY=927714775247856
CLOUDINARY_API_SECRET=esenGxBrjIuyPRmHtFdDpJY9n-Q
```

### 4. Chạy development server
```bash
npm run dev
# hoặc
yarn dev
```

### 5. Build cho production
```bash
npm run build
npm start
```

## 🎯 Hướng dẫn sử dụng

### Đăng nhập
1. Truy cập `http://localhost:3000`
2. Đăng nhập bằng tài khoản Firebase Auth
3. Nếu chưa có admin, tạo tài khoản admin đầu tiên

### Quản lý nội dung
1. **Tạo bài viết mới**: Dashboard → Content → "Tạo bài viết"
2. **Chỉnh sửa bài viết**: Click icon Edit trên danh sách
3. **Đặt làm nổi bật**: Click icon Star
4. **Thao tác hàng loạt**: Chọn nhiều bài viết → "Thao tác hàng loạt"

### Quản lý người dùng
1. **Xem danh sách**: Dashboard → Users
2. **Phân quyền**: Click Edit → Chọn role mới
3. **Xem chi tiết**: Click icon View để xem hoạt động
4. **Khóa tài khoản**: Click icon Block

### Upload Video
1. **Tải lên**: Dashboard → Videos → "Tải lên Video"
2. **Kéo thả file**: Drag & drop video vào vùng upload
3. **Theo dõi**: Xem trạng thái xử lý trong danh sách

### Xem Analytics
1. **Chọn khoảng thời gian**: Analytics → Date picker
2. **Xem biểu đồ**: Tabs khác nhau cho các loại phân tích
3. **Xuất báo cáo**: Click "Xuất báo cáo" để download JSON

## 🔐 Phân quyền hệ thống

### Admin
- Toàn quyền truy cập tất cả chức năng
- Quản lý phân quyền người dùng
- Cấu hình hệ thống

### Editor
- Tạo, sửa, xuất bản nội dung
- Quản lý danh mục
- Xem analytics

### Moderator
- Kiểm duyệt nội dung
- Quản lý bình luận
- Khóa/mở khóa người dùng

### Analyst
- Chỉ xem analytics và báo cáo
- Export dữ liệu

### Viewer
- Chỉ xem nội dung, không chỉnh sửa

## 📊 Tích hợp dịch vụ

### Firebase
- **Authentication**: Đăng nhập/đăng ký
- **Realtime Database**: Lưu trữ dữ liệu
- **Analytics**: Theo dõi hành vi người dùng

### Cloudinary
- **Upload media**: Hình ảnh, video
- **Transformation**: Tự động resize, optimize
- **CDN**: Phân phối nội dung nhanh

## 🐛 Debug và Monitor

### Logs
- Browser Console: Xem error client-side
- Network Tab: Kiểm tra API calls
- Firebase Console: Monitor database

### Performance
- Next.js Analytics: Build time, bundle size
- Lighthouse: Performance audit
- Firebase Performance: Real-time monitoring

## 🔮 Roadmap phát triển

### Phase 1 - MVP ✅
- [x] CRUD nội dung cơ bản
- [x] Upload media với Cloudinary
- [x] Dashboard analytics
- [x] Quản lý người dùng

### Phase 2 - Advanced Features
- [ ] Rich text editor cho bài viết
- [ ] Workflow duyệt nội dung
- [ ] Scheduled publishing
- [ ] Bulk import/export
- [ ] Email notifications
- [ ] Mobile responsive

### Phase 3 - Enterprise
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] A/B testing
- [ ] Content personalization
- [ ] API documentation
- [ ] Webhook integration

## 🤝 Contributing

1. Fork project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Hỗ trợ

- **Email**: support@healthtips.com
- **Documentation**: [Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for HealthTips Community**
