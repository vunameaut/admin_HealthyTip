# Hướng dẫn Test Chức Năng Cài Đặt Tài Khoản

## ✅ Đã Cập Nhật

### Cải thiện:
1. **Thông báo lỗi rõ ràng** - Nếu chưa đăng nhập sẽ hiển thị thông báo
2. **Console logging** - Có thể xem log trong DevTools để debug
3. **Thêm updatedAt timestamp** - Lưu thời gian cập nhật
4. **UI feedback** - Hiển thị warning nếu currentUser chưa load

## 🧪 Cách Test

### 1. Mở Browser DevTools
```
F12 hoặc Ctrl+Shift+I
```

### 2. Truy cập trang Cài đặt
```
http://localhost:3000/dashboard/settings
```

### 3. Kiểm tra Console
Trong tab Console, bạn sẽ thấy:
- `Saving notifications: {...}` - Khi click "Lưu cài đặt" tab Thông báo
- `Notifications saved successfully` - Khi lưu thành công
- Hoặc thông báo lỗi nếu có vấn đề

### 4. Test từng Tab:

#### Tab Thông báo:
```
1. Bật/tắt các switch
2. Click "Lưu cài đặt"
3. Xem console log
4. Kiểm tra toast notification (góc phải màn hình)
5. Refresh trang → Cài đặt vẫn được giữ
```

#### Tab Bảo mật:
```
1. Bật/tắt 2FA và Login Alerts
2. Thay đổi Session Timeout
3. Click "Lưu cài đặt"
4. Xem console log
5. Kiểm tra toast notification
```

#### Tab Hiển thị:
```
1. Thay đổi Language, Timezone, Date Format
2. Bật/tắt Dark Mode
3. Thay đổi Items per page
4. Click "Lưu cài đặt"
5. Xem console log
```

### 5. Kiểm tra Firebase
```
1. Mở Firebase Console
2. Vào Realtime Database
3. Navigate đến: users/{your_uid}/settings
4. Xem các node:
   - notifications
   - security
   - preferences
   - updatedAt
```

### 6. Kiểm tra localStorage
```javascript
// Trong Console DevTools:
// Xem notifications
localStorage.getItem('notifications_{your_uid}')

// Xem security
localStorage.getItem('security_{your_uid}')

// Xem preferences
localStorage.getItem('preferences_{your_uid}')
```

## 🐛 Troubleshooting

### Nếu không lưu được:

1. **Kiểm tra currentUser:**
   ```javascript
   // Trong Console:
   console.log(currentUser)
   ```
   - Nếu `null` → Chưa đăng nhập
   - Nếu `undefined` → AuthGuard chưa load xong

2. **Kiểm tra Firebase connection:**
   ```javascript
   // Trong Console, xem có lỗi Firebase không
   // Hoặc kiểm tra Network tab
   ```

3. **Xóa cache và thử lại:**
   ```
   Ctrl+Shift+Delete → Clear cache
   Hoặc Ctrl+F5 (Hard refresh)
   ```

4. **Kiểm tra Firebase Rules:**
   - Vào Firebase Console
   - Realtime Database → Rules
   - Đảm bảo có quyền write vào `users/{uid}/settings`

## 📊 Expected Behavior

### Khi Click "Lưu cài đặt":

1. ✅ Button disabled (loading state)
2. ✅ Console log: "Saving {type} settings: {...}"
3. ✅ Lưu vào localStorage
4. ✅ Lưu vào Firebase
5. ✅ Console log: "{Type} settings saved successfully"
6. ✅ Toast notification hiển thị: "Cài đặt {type} đã được lưu!"
7. ✅ Button enabled lại

### Khi Có Lỗi:

1. ❌ Console log: "Error saving {type}: {error}"
2. ❌ Toast notification: "Có lỗi xảy ra khi lưu cài đặt"
3. ✅ Button enabled lại

## 🔍 Debug Steps

### Step 1: Kiểm tra User Login
```javascript
// Console:
console.log('Current user:', currentUser)
```

### Step 2: Test Save Function
```javascript
// Console (khi ở trang settings):
// Mở React DevTools → Components
// Tìm UserSettingsPage
// Xem props và state
```

### Step 3: Manual Test Firebase
```javascript
// Console:
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';

const testSave = async () => {
  const userRef = ref(database, 'users/{your_uid}/settings');
  await update(userRef, { test: 'Hello' });
  console.log('Test saved!');
};

testSave();
```

## ✅ Success Criteria

Chức năng hoạt động đúng khi:

- ✅ Click "Lưu cài đặt" → Toast notification xuất hiện
- ✅ Refresh trang → Cài đặt vẫn còn
- ✅ Kiểm tra Firebase → Dữ liệu có trong database
- ✅ Kiểm tra localStorage → Dữ liệu có trong browser
- ✅ Console không có lỗi (error)

## 📝 Notes

- Nếu vẫn không hoạt động, copy toàn bộ console error và gửi cho tôi
- Kiểm tra Network tab để xem Firebase requests
- Đảm bảo đã đăng nhập với tài khoản admin
