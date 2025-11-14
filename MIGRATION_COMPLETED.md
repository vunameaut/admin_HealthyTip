# Migration Completed - Backend Server Integration

## Tổng quan

Đã hoàn thành việc chuyển toàn bộ chức năng từ backend server (`healthtips-backend-server`) sang admin panel này. Bây giờ bạn chỉ cần chạy **1 server duy nhất** - admin panel.

## Những gì đã được chuyển

### 1. Firebase Admin SDK Integration
- ✅ Firebase Admin được khởi tạo trong `src/lib/firebaseAdmin.ts`
- ✅ Hỗ trợ Realtime Database, Firestore, và Firebase Cloud Messaging
- ✅ Helper function `saveNotificationHistory()` để lưu lịch sử thông báo

### 2. API Endpoints đã được migrate
Tất cả các API endpoints giờ đây gọi trực tiếp Firebase Admin SDK thay vì forward đến backend server:

- ✅ `/api/notifications/stats` - Thống kê users và health tips
- ✅ `/api/notifications/users` - Lấy danh sách users
- ✅ `/api/notifications/broadcast` - Gửi thông báo broadcast
- ✅ `/api/notifications/send-to-user` - Gửi thông báo đến 1 user
- ✅ `/api/notifications/send-new-health-tip` - Thông báo bài viết mới
- ✅ `/api/notifications/send-comment-reply` - Thông báo comment reply
- ✅ `/api/notifications/send-recommendation` - Thông báo khuyến nghị
- ✅ `/api/notifications/send-custom` - Thông báo tùy chỉnh
- ✅ `/api/notifications/history` - Lịch sử thông báo
- ✅ `/api/notifications/health-tips` - Danh sách health tips
- ✅ `/api/notifications/categories` - Danh sách categories

### 3. Notification History
- ✅ Tất cả thông báo được tự động lưu vào Firestore collection `notificationHistory`
- ✅ Bao gồm thông tin: type, title, body, data, sentTo, sentCount, failureCount, status, timestamp

### 4. Đã xóa dependencies với backend server cũ
- ✅ Không còn sử dụng `BACKEND_URL`
- ✅ Không còn sử dụng `BACKEND_API_KEY`
- ✅ Không còn forward requests qua axios

## Setup và Configuration

### 1. Environment Variables cần thiết

Tạo file `.env.local` với nội dung (copy từ `.env.example`):

```env
# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_DATABASE_URL=https://your-project.firebaseio.com

# Firebase Client SDK (cho admin authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Cloudinary (nếu sử dụng)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 2. Cách lấy Firebase Admin credentials

1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn project của bạn
3. Vào **Project Settings** (⚙️) > **Service Accounts**
4. Click **Generate new private key**
5. Lưu file JSON và copy các giá trị vào `.env.local`

**Lưu ý quan trọng về FIREBASE_ADMIN_PRIVATE_KEY:**
- Private key phải bao gồm `\n` cho newlines
- Bọc toàn bộ key trong dấu ngoặc kép
- Ví dụ: `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

### 3. Chạy server

```bash
# Install dependencies (nếu chưa)
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## Những thay đổi so với backend server cũ

### Giống nhau:
- ✅ Tất cả API endpoints hoạt động giống như cũ
- ✅ Request/response format không đổi
- ✅ Firebase Admin SDK được sử dụng giống như cũ
- ✅ Notification history được lưu vào Firestore

### Khác biệt:
- ⚡ Không cần API key middleware (sử dụng Firebase Auth token thay vì)
- ⚡ Tích hợp trực tiếp trong Next.js API routes
- ⚡ Không cần CORS configuration
- ⚡ Notification service client (`src/services/notificationService.ts`) gọi trực tiếp local APIs

## Testing

Sau khi migration, hãy test các chức năng sau:

1. ✅ Login vào admin panel
2. ✅ Xem statistics (số users, health tips, etc.)
3. ✅ Gửi broadcast notification
4. ✅ Gửi notification đến 1 user cụ thể
5. ✅ Xem notification history
6. ✅ Test các notification types khác (new health tip, comment reply, etc.)

## Troubleshooting

### Lỗi "Firebase Admin initialization failed"
- Kiểm tra lại các biến môi trường trong `.env.local`
- Đảm bảo FIREBASE_ADMIN_PRIVATE_KEY được format đúng với `\n`

### Lỗi "User or FCM token not found"
- User cần có FCM token trong Firebase Realtime Database
- Check path: `users/{userId}/fcmToken`

### Lỗi "Unauthorized"
- Đảm bảo bạn đã login vào admin panel
- Firebase Auth token được tự động thêm vào requests

## Backend Server Cũ

Backend server cũ (`healthtips-backend-server`) **KHÔNG còn cần thiết** nữa và có thể được:
- Tắt đi
- Xóa khỏi deployment (Railway, Heroku, etc.)
- Giữ lại như backup (nhưng không cần chạy)

## Files đã thay đổi

1. `src/lib/firebaseAdmin.ts` - Thêm helper functions
2. `src/pages/api/notifications/*.ts` - Migrate tất cả APIs
3. `.env.example` - Template cho environment variables
4. Tất cả các API files không còn sử dụng axios để forward requests

## Kết luận

✅ Migration hoàn tất thành công!
✅ Giờ bạn chỉ cần chạy 1 server duy nhất
✅ Tất cả chức năng notification đã được tích hợp vào admin panel
✅ Code đơn giản hơn, không cần maintain 2 servers riêng biệt

Nếu có vấn đề gì, hãy check lại:
1. Environment variables trong `.env.local`
2. Firebase Admin credentials
3. Console logs khi chạy `npm run dev`
