# HealthTips Admin - Cập nhật Chức năng Upload Video và Tạo Bài Viết

## 🚀 Các cải tiến đã thực hiện

### 1. **Chức năng tạo bài viết mới với Rich Content**

#### ✅ Tính năng đã cập nhật:
- **Rich Content Editor**: Hỗ trợ nhiều loại nội dung (văn bản, tiêu đề, hình ảnh, trích dẫn)
- **Drag & Drop**: Sắp xếp lại thứ tự các khối nội dung dễ dàng
- **Preview Mode**: Xem trước bài viết trước khi xuất bản
- **Upload ảnh**: Tự động upload ảnh lên Cloudinary
- **Quản lý metadata**: Alt text, caption cho hình ảnh, cấp độ heading

#### 📁 Files đã tạo/cập nhật:
- `src/components/RichContentEditor.tsx` - Component editor nội dung phong phú
- `src/pages/content/create.tsx` - Cập nhật sử dụng RichContentEditor
- `src/types/index.ts` - Thêm ContentBlock interface

### 2. **Cải thiện chức năng Upload Video**

#### ✅ Tính năng đã cập nhật:
- **Form chi tiết hơn**: Thêm nhiều trường thông tin như data mẫu
- **Upload Progress**: Hiển thị tiến trình upload từng file
- **Batch Upload**: Upload nhiều video cùng lúc
- **Cloudinary Integration**: Lưu đúng cấu trúc với cldPublicId, cldVersion
- **Thumbnail tự động**: Tự động generate thumbnail từ Cloudinary

#### 📁 Files đã tạo/cập nhật:
- `src/components/VideoUploadForm.tsx` - Form upload video mới
- `src/components/UploadProgress.tsx` - Component hiển thị tiến trình
- `src/components/VideoPlayer.tsx` - Player video cải thiện
- `src/pages/videos/index.tsx` - Cập nhật logic upload
- `src/pages/api/cloudinary/image-signature.ts` - API endpoint cho image upload

### 3. **Cập nhật Data Structure**

#### 🗄️ Cấu trúc dữ liệu video:
```json
{
  "id": "v10",
  "caption": "Mẹo uống đủ nước mỗi ngày.",
  "categoryId": "category_1757393748346",
  "cldPublicId": "uong-nuoc-dung-cach_fi126b",
  "cldVersion": 1755156110,
  "thumb": "https://res.cloudinary.com/dazo6ypwt/image/upload/v1737556502/samples/outdoor-woman.jpg",
  "title": "Uống nước đúng cách",
  "status": "draft",
  "tags": {
    "dinhduong": true,
    "suckhoe": true
  },
  "viewCount": 22121,
  "likeCount": 1875,
  "duration": 15,
  "width": 576,
  "height": 1024,
  "uploadDate": 1734306545678,
  "updatedAt": 1757400721354,
  "userId": "demo_user"
}
```

## 🛠️ Cách sử dụng

### Upload Video:
1. Vào trang **Quản lý Video** (`/videos`)
2. Click **"Tải lên Video"**
3. Drag & drop hoặc chọn video files
4. Điền thông tin: tiêu đề, mô tả, danh mục, tags
5. Click **"Tải lên"**

### Tạo bài viết:
1. Vào trang **Quản lý Nội dung** (`/content`)
2. Click **"Tạo bài viết mới"**
3. Sử dụng Rich Editor:
   - Thêm khối văn bản, tiêu đề, hình ảnh, trích dẫn
   - Sắp xếp thứ tự bằng mũi tên lên/xuống
   - Upload hình ảnh trực tiếp
   - Xem trước bài viết
4. Thiết lập danh mục, tags, trạng thái
5. Click **"Lưu bài viết"**

## 🔧 Cấu hình Environment Variables

Đảm bảo có các biến môi trường trong `.env.local`:

```env
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 🎯 Các cải tiến đã thực hiện

### Video Upload:
- ✅ Hỗ trợ format: MP4, MOV, AVI, MKV, WebM, M4V
- ✅ Giới hạn size: 100MB per file
- ✅ Batch upload multiple videos
- ✅ Real-time upload progress
- ✅ Auto-generate thumbnails
- ✅ Retry failed uploads
- ✅ Cloudinary integration với signed uploads

### Content Editor:
- ✅ WYSIWYG Rich Editor
- ✅ Multiple content blocks (text, heading, image, quote)
- ✅ Drag & drop reordering
- ✅ Live preview mode
- ✅ Auto image upload to Cloudinary
- ✅ SEO-friendly structure

### Data Management:
- ✅ Consistent với data structure mẫu
- ✅ Proper Cloudinary URLs with transformations
- ✅ Tags as object structure
- ✅ Complete metadata tracking

## 🐛 Các lỗi đã sửa

1. **Upload video**: Sửa cấu trúc dữ liệu theo format mẫu
2. **Content blocks**: Backward compatibility với old format
3. **Cloudinary URLs**: Sử dụng proper transformations
4. **Type safety**: Thêm proper TypeScript types
5. **Error handling**: Better error messages và retry logic

## 📦 Dependencies mới

Các package đã có sẵn trong project:
- `react-dropzone` - File drag & drop
- `@mui/material` - UI components
- `@mui/x-data-grid` - Data table
- `cloudinary` - Cloudinary SDK
- `firebase` - Firebase SDK

## 🚀 Chạy project

```bash
# Install dependencies (nếu cần)
npm install

# Start development server
npm run dev

# Build production
npm run build
```

Project sẽ chạy tại: http://localhost:3000

## 📝 Ghi chú

- Video upload sử dụng Cloudinary signed upload để bảo mật
- Hình ảnh trong bài viết cũng được upload lên Cloudinary
- Data được lưu trong Firebase Realtime Database
- UI responsive và tối ưu cho mobile

Tất cả các chức năng đã được test và sẵn sàng sử dụng! 🎉
