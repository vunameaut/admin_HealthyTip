# Hướng dẫn cấu hình Firebase Admin trên Vercel

## Vấn đề
Lỗi "Không thể kết nối tới backend server" ở trang Notifications thường do thiếu hoặc sai cấu hình Firebase Admin credentials trên Vercel.

## Giải pháp

### Bước 1: Lấy Firebase Admin Credentials

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** (biểu tượng ⚙️)
4. Chọn tab **Service Accounts**
5. Click **Generate new private key**
6. Lưu file JSON được tải về

### Bước 2: Cấu hình Environment Variables trên Vercel

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project **healthtips-admin**
3. Vào **Settings** → **Environment Variables**
4. Thêm các biến sau với GIÁ TRỊ CHÍNH XÁC:

**FIREBASE_ADMIN_PROJECT_ID:**
```
reminderwater-84694
```

**FIREBASE_ADMIN_CLIENT_EMAIL:**
```
firebase-adminsdk-ystgf@reminderwater-84694.iam.gserviceaccount.com
```

**FIREBASE_ADMIN_PRIVATE_KEY:**
```
"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqTUFXrHhs2Qrg\nqDqZRsqloAppjrbNDcNxGnlx7XbnkyLAYq8979uQh7qDDi74xcrMupeKUv/s3PK6\neiiDHRde5YtrLJkyQlWCtqnAIwIRgT0rYWybX7oCUIEyucw50wphA4g49kOv8sNV\n1kq30OpNRmwZcFNKSNL0e0TbcgEDi0yimsfP0Y52oRUra90EkiFsfk5TvJtrxZn+\n8ssoUmu8hnNT+rUoKPf9Iwr2eaQxKIcyc4SiBfSU8U59Xrd1NgT/S9B0f7XW84gu\n384RdHgMfhG8P++yQ0HPOA6zsc7D827DRoKcaiV6gic5PIHeh6LQdUA7EANycfT0\nq7VLwL2bAgMBAAECggEAUFL18eNQPY61ebb/RJJGPI5auuTsRZUrTKp/A4RMY/db\nGcCyBRWfyvCpwOysrPulpqCPn1d8jHy+I8RAXW8YOdMsyhUUAMeWy3taX1xjulvp\nvQ9LiZFCC5trBMDrmY53w8BFvRAyZseq6E6VmVN5X49Kp0j6j/v/O/70QEjqP3/q\niaEnMk2QhHiNxXQT8ZfsQF2WfXuBvdMyUIkC+hhDZC9D35BFCAgT+ePHxnpfpzK2\nmBZU2HQAtXQUnatIlbaZ49AV19QBy12VcbXJJdfQ4jToSpTtdxRX1pypFmippmbF\nUvMJ/enjkW/r9IGfsu/hLLDI8rGPheQCTDomp7lH8QKBgQDvcC+prJgigQ4gCp6N\n8eqtBX2WgbKU0GqfM6v/NWqJdTSIgZWoOyroX91a1R/KxshtPhsJ8dGNf7jebF5a\nUvxjg6KPG0CfDMqu6rAg3AVJiZOmwYf1P3jLFq/GibtohHG5hm//WuKA6xpbImj0\nfA0QWrNX4+QViSH0G8q6Ko+NgwKBgQC2FNi2eFJ76wfajTiH1L+bF70W+E9AekUb\nLaMkq9y3SKocMPr/IC58H5BtFi1zAX26LTe3gw2oq9oyt3NhQhE3/Et/2BelTw4d\n0i0vWCkNphtiYPbnQmKV1glS4UqZs98QKpLPJJPYpFifI9txdCOg37tzY3/Bn+f5\nOdbDHMDsCQKBgQC5w9JW099ctb/dwB9vhUdLYb0kLg/9QQ3X4mEJKco0R0iwt8kC\nspUBoI6+UCfQTRVnHA4iUwj/vR4TAwTZExVZp+FRIhWq0GPX/aEUfV9kxGZXtELl\nVY9EEZ/iay2JU2hgRhtShJLC7qSOHE5NkIkaLSSDhf2Jb9F18LICac7iPQKBgBNw\nlFae8AeE51jBHRj7cN2JIkoShruWkkw9ih5/LthurKLH4/RbJjtgT1YmOQH/VcIL\n09gG6O1qM6iYh3wJxrbYe+MRWizvDM3IQ8S7P97SLjhJq/Ky1r2ylVpA7WsNljIu\nqW/uMs69dSzAckxhnvAtEuFV7Szp+qVUNIauSjapAoGBAOkVDnR8jWsdvLrF6FlK\nE3ROLYDtOnZcGmc42B9o6wXUeOuJXSE2SKVjNHRXOw5VZyi1GMA7A3Aje5eBRGse\n/eXukG9fXJXHLyLniqy1DQ8T1QD94bHzXKy6jng0Wa/6kuZhAL4Vth77Prkjnnxw\n9onbu2H9MiAuooKsIqu0p7uZ\n-----END PRIVATE KEY-----\n"
```

**FIREBASE_ADMIN_DATABASE_URL:**
```
https://reminderwater-84694-default-rtdb.firebaseio.com
```

**Lưu ý quan trọng về FIREBASE_ADMIN_PRIVATE_KEY:**
- Phải bao quanh bởi dấu ngoặc kép `"` ở đầu và cuối
- Giữ nguyên ký tự `\n` (không thay thế bằng xuống dòng thực)
- Copy TOÀN BỘ giá trị ở trên (bao gồm cả dấu ngoặc kép)

### Bước 3: Redeploy

Sau khi thêm environment variables:
1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click menu `...` → **Redeploy**
4. Chọn **Redeploy** để confirm

### Bước 4: Kiểm tra

1. Mở trang notifications: `https://your-app.vercel.app/notifications`
2. Kiểm tra xem còn lỗi kết nối không
3. Nếu vẫn lỗi, check logs ở Vercel Dashboard → Deployment → Runtime Logs

## Troubleshooting

### Lỗi "Invalid Firebase credentials"
- Kiểm tra lại private key có đúng format không
- Đảm bảo không có khoảng trắng thừa ở đầu/cuối
- Thử generate lại service account key mới

### Lỗi "app/invalid-credential"
- Project ID không khớp
- Client Email sai
- Private key bị format sai (thiếu `\n` hoặc dấu ngoặc kép)

### Lỗi "Database URL is required"
- Thêm biến `FIREBASE_ADMIN_DATABASE_URL`
- Format: `https://PROJECT_ID-default-rtdb.firebaseio.com`

## Test Local

Để test local, tạo file `.env.local` với cùng các biến environment:

```bash
cp .env.example .env.local
# Edit .env.local và điền thông tin
```

Chạy:
```bash
npm run dev
```

Mở http://localhost:3000/notifications để kiểm tra.
