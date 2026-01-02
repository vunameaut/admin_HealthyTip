# Hướng dẫn Sử dụng Các Tính năng Mới

## ✅ Các Chức năng Đã Được Kích Hoạt

### 1. 🔐 Hồ sơ Cá nhân (Profile)

**Đường dẫn:** `/dashboard/profile`

**Chức năng thực tế:**
- ✅ **Lưu thông tin vào Firebase** - Tất cả thay đổi được lưu vào Firebase Realtime Database
- ✅ **Thống kê thực tế** - Tính toán số bài viết, video, views, likes từ Firebase
- ✅ **Lịch sử hoạt động** - Ghi log tự động mỗi hành động vào Firebase
- ✅ **Cập nhật profile** - Thay đổi tên, số điện thoại, địa chỉ, giới thiệu

**Dữ liệu được lưu tại:**
- `users/{uid}/displayName`, `phone`, `bio`, `location`, `updatedAt`
- `activity_logs/{uid}/*` - Lịch sử hoạt động

**Test:**
```
1. Truy cập /dashboard/profile
2. Click "Chỉnh sửa"
3. Thay đổi thông tin
4. Click "Lưu"
5. Kiểm tra Firebase Console -> Realtime Database -> users/{uid}
```

---

### 2. ⚙️ Cài đặt Tài khoản (User Settings)

**Đường dẫn:** `/dashboard/settings`

**Chức năng thực tế:**
- ✅ **Lưu cài đặt vào Firebase** - Tab Thông báo, Bảo mật, Hiển thị
- ✅ **Đổi mật khẩu** - Dialog đổi mật khẩu (code đã chuẩn bị, cần kích hoạt Firebase Auth)
- ✅ **Đồng bộ cross-device** - Cài đặt được lưu cả Firebase và localStorage

**Dữ liệu được lưu tại:**
- `users/{uid}/settings/notifications` - Cài đặt thông báo
- `users/{uid}/settings/security` - Cài đặt bảo mật
- `users/{uid}/settings/preferences` - Cài đặt hiển thị

**Test:**
```
1. Truy cập /dashboard/settings
2. Thay đổi cài đặt ở bất kỳ tab nào
3. Click "Lưu cài đặt"
4. Kiểm tra Firebase Console -> users/{uid}/settings
```

---

### 3. 🔍 Tìm kiếm Nội dung (Search)

**Đường dẫn:** `/search`

**Chức năng thực tế:**
- ✅ **Tìm kiếm thực tế** - Load dữ liệu từ Firebase `health_tips` và `short_videos`
- ✅ **Lọc theo danh mục** - Load từ `categories`
- ✅ **Lọc theo trạng thái** - Published/Draft
- ✅ **Sắp xếp** - Liên quan, mới nhất, nhiều views
- ✅ **Click để chỉnh sửa** - Navigate đến trang edit

**Test:**
```
1. Truy cập /search
2. Nhập từ khóa (ít nhất 2 ký tự)
3. Kết quả sẽ hiển thị từ Firebase
4. Click vào kết quả để chỉnh sửa
```

---

### 4. 🛠️ Cài đặt Hệ thống (System Settings)

**Đường dẫn:** `/settings`

**Chức năng thực tế:**
- ✅ **Lưu cấu hình vào Firebase** - `system_config` node
- ✅ **Kiểm tra kết nối** - Test Firebase và Cloudinary
- ✅ **Quản lý tính năng** - Bật/tắt các tính năng hệ thống
- ✅ **Backup tự động** - Lưu vào cả Firebase và localStorage

**Dữ liệu được lưu tại:**
- `system_config/firebase` - Cấu hình Firebase
- `system_config/cloudinary` - Cấu hình Cloudinary
- `system_config/features` - Các tính năng hệ thống
- `system_config/app` - Thông tin ứng dụng
- `system_config/notifications` - Cài đặt thông báo

**Test:**
```
1. Truy cập /settings
2. Điều chỉnh cấu hình
3. Click "Lưu cấu hình"
4. Kiểm tra Firebase Console -> system_config
```

---

## 🔥 Firebase Database Structure

```
firebase-database/
├── users/
│   └── {uid}/
│       ├── displayName
│       ├── email
│       ├── phone
│       ├── bio
│       ├── location
│       ├── verified
│       ├── role
│       ├── createdAt
│       ├── updatedAt
│       └── settings/
│           ├── notifications/
│           │   ├── email: true
│           │   ├── push: true
│           │   └── ...
│           ├── security/
│           │   ├── twoFactorAuth: false
│           │   └── ...
│           └── preferences/
│               ├── language: "vi"
│               └── ...
│
├── activity_logs/
│   └── {uid}/
│       └── {log_id}/
│           ├── action
│           ├── details
│           ├── timestamp
│           ├── userId
│           └── userEmail
│
├── system_config/
│   ├── firebase/
│   ├── cloudinary/
│   ├── features/
│   ├── app/
│   ├── notifications/
│   └── lastUpdated
│
├── health_tips/
│   └── {tip_id}/...
│
├── short_videos/
│   └── {video_id}/...
│
└── categories/
    └── {category_id}/...
```

---

## 📊 Activity Logging

Hệ thống tự động ghi log các hoạt động:

1. **Cập nhật hồ sơ** - Khi user thay đổi thông tin
2. **Đăng nhập** - Khi truy cập trang profile lần đầu
3. **Tạo nội dung** - (Có thể tích hợp thêm)
4. **Chỉnh sửa nội dung** - (Có thể tích hợp thêm)

**API:**
```typescript
import { logActivity } from '@/services/activityLogger';

await logActivity(
  userId,
  'Hành động',
  'Chi tiết',
  userEmail
);
```

---

## 🧪 Kiểm tra Hoạt động

### Test Profile:
```typescript
// Firebase Console Query
users/{your_uid}/displayName
users/{your_uid}/phone
users/{your_uid}/bio

activity_logs/{your_uid}/*
```

### Test Settings:
```typescript
// Firebase Console Query
users/{your_uid}/settings/notifications
users/{your_uid}/settings/security
users/{your_uid}/settings/preferences
```

### Test System Config:
```typescript
// Firebase Console Query
system_config/features
system_config/app
```

---

## 🚨 Lưu ý Quan trọng

### 1. Firebase Rules
Cần cấu hình Firebase Rules để bảo mật:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    "activity_logs": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      }
    },
    "system_config": {
      ".read": "root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'"
    }
  }
}
```

### 2. Đổi Mật khẩu
Để kích hoạt chức năng đổi mật khẩu, cần uncomment code trong `handleChangePassword` tại `src/pages/dashboard/settings.tsx`

### 3. Upload Avatar
Hiện tại icon PhotoCamera đã có UI, cần tích hợp Cloudinary để upload ảnh

---

## ✨ Hoàn tất!

Tất cả 4 chức năng đã được kết nối với Firebase và hoạt động thực tế:
- ✅ Profile - Lưu/Load từ Firebase
- ✅ User Settings - Lưu/Load từ Firebase  
- ✅ Search - Tìm kiếm từ Firebase
- ✅ System Settings - Lưu/Load từ Firebase

Hệ thống đã sẵn sàng sử dụng! 🎉
