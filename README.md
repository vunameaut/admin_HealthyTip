# Admin Web cho Ứng dụng Mẹo Sức Khỏe

## 1. Quản lý Nội dung (Content CMS)
- CRUD bài viết (Health Tips): editor rich-text, chèn ảnh, tags, category, status, schedule.
- CRUD video: gắn Cloudinary public_id, thumb, category, tags.
- CRUD danh mục & tag.
- Bộ sưu tập (Collections): nhóm nội dung theo chủ đề.
- Nhập/Xuất dữ liệu JSON.

## 2. Pipeline Media (Cloudinary)
- Upload file kéo-thả, tự sinh thumbnail.
- Quản lý preset (HLS/DASH, q_auto).
- Đổi tên/di chuyển file theo convention.
- Kiểm tra trạng thái xử lý video.

## 3. Quản lý Người dùng & Phân quyền
- Quản lý user app: hồ sơ, lượt xem/like.
- RBAC: Admin, Editor, Moderator, Analyst, Viewer.
- Khóa/Tạm ngưng tài khoản.

## 4. Tìm kiếm & SEO nội bộ
- Tìm kiếm theo title/caption/tag.
- Bộ lọc: status, category, tác giả, ngày.
- Gợi ý từ khóa thiếu.

## 5. Điều độ (Curation) & Xuất bản
- Lịch biên tập theo ngày/tuần.
- Quy trình duyệt 2 bước (Editor → Reviewer → Publish).
- Pin/Feature nội dung nổi bật.

## 6. Báo cáo & Phân tích
- KPI: DAU/MAU, thời gian đọc/xem.
- Hiệu suất nội dung: view/like/share.
- Từ khóa tìm kiếm phổ biến.
- Funnel hành vi người dùng.

## 7. Kiểm duyệt & An toàn
- Phát hiện dữ liệu thiếu (thumb, public_id).
- Kiểm tra link Cloudinary.
- Ẩn nhanh nội dung (soft-delete).

## 8. Thông báo & Chiến dịch
- Push/Email builder.
- Segmentation theo sở thích.
- Lên lịch gửi.
- Theo dõi CTR.

## 9. Cấu hình Hệ thống
- Cloudinary: cloud name, API keys.
- Firebase: DB path, rules.
- Feature Flags.
- Audit Logs.

## 10. Lộ trình phát triển
- **MVP (1–2 tuần):** CRUD nội dung, Upload Cloudinary, Import/Export JSON.
- **V1 (4–6 tuần):** Lịch biên tập, Analytics, Collections, Thông báo.

---

## 11. Cấu hình & Tích hợp

### 11.1 Firebase
- Project ID: reminderwater-84694
- Database: Realtime Database
- Database URL: https://reminderwater-84694-default-rtdb.firebaseio.com/
- API Key: AIzaSyAXWk6glK6hpXQkiunvydjFNtM56yxwN_w
- Auth Domain: reminderwater-84694.firebaseapp.com
- Storage Bucket: reminderwater-84694.appspot.com
→ Kết nối để CRUD dữ liệu bài viết/video/danh mục.

### 11.2 Cloudinary
- Cloud name: dazo6ypwt
- API Key: 927714775247856
- API Secret: esenGxBrjIuyPRmHtFdDpJY9n-Q
- Upload preset: default
- Folder convention: healthy_tip/{category}/{year}/{month}/{slug}
→ Upload media, lấy public_id, version, thumb.

### 11.3 Authentication & RBAC
- Dùng Firebase Auth (Email/Password hoặc Google Sign-In).
- Roles: admin, editor, moderator, analyst, viewer.
- Default Admin: user đầu tiên gán role admin.

### 11.4 Env Config (.env)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAXWk6glK6hpXQkiunvydjFNtM56yxwN_w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=reminderwater-84694.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DB_URL=https://reminderwater-84694-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=reminderwater-84694
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=reminderwater-84694.appspot.com

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dazo6ypwt
CLOUDINARY_API_KEY=927714775247856
CLOUDINARY_API_SECRET=esenGxBrjIuyPRmHtFdDpJY9n-Q
```

### 11.5 Cài đặt & Khởi chạy
1. Clone repo Admin.
2. `npm install` hoặc `yarn install`.
3. Tạo file `.env` với thông tin cấu hình trên.
4. `npm run dev` để chạy local.
5. Deploy lên Vercel/Netlify.

### 11.6 Quy trình Triển khai
1. Admin login → Dashboard.
2. CRUD nội dung (bài viết/video).
3. Upload media → Cloudinary (tự động lưu public_id, version, thumb).
4. Lưu metadata vào Firebase DB.
5. App client hiển thị nội dung mới ngay.
"# admin_HealthyTip" 
