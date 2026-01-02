# Hướng dẫn sử dụng chức năng Preview (Xem trước)

## Tổng quan
Chức năng Preview cho phép bạn xem trước bài viết trước khi lưu hoặc xuất bản, giúp kiểm tra giao diện và nội dung một cách trực quan.

## Các trang có chức năng Preview

### 1. Trang danh sách nội dung (`/content`)
**Cách sử dụng:**
- Vào trang "Quản lý nội dung"
- Trong bảng danh sách bài viết, mỗi hàng có cột "Thao tác"
- Nhấn vào icon **mắt** (👁️ Visibility) để xem preview bài viết
- Dialog preview sẽ hiển thị đầy đủ thông tin bài viết

**Thông tin hiển thị trong preview:**
- Tiêu đề bài viết
- Trạng thái (Đã xuất bản/Bản nháp/Lưu trữ)
- Badge nổi bật (nếu có)
- Thông tin meta: Tác giả, Ngày tạo, Danh mục
- Lượt xem và lượt thích
- Ảnh đại diện (nếu có)
- Video (nếu có)
- Nội dung đầy đủ với các định dạng:
  - Text (văn bản)
  - Heading (tiêu đề các cấp)
  - Image (hình ảnh với caption)
  - Quote (trích dẫn với tác giả)
- Tags (thẻ phân loại)

### 2. Trang thêm bài viết (`/content/create`)
**Cách sử dụng:**
- Vào trang "Tạo bài viết mới"
- Điền thông tin bài viết
- Nhấn nút **"Xem trước"** ở góc trên bên phải (bên cạnh nút Lưu)
- Preview sẽ hiển thị bài viết với dữ liệu hiện tại đang nhập

**Lợi ích:**
- Kiểm tra bố cục trước khi lưu
- Xem trước cách nội dung hiển thị
- Phát hiện lỗi định dạng
- Đảm bảo ảnh/video hiển thị đúng

### 3. Trang chỉnh sửa bài viết (`/content/edit/[id]`)
**Cách sử dụng:**
- Vào trang chỉnh sửa bài viết
- Thực hiện các thay đổi cần thiết
- Nhấn nút **"Xem trước"** ở góc trên bên phải
- Dialog preview sẽ hiển thị bài viết với các thay đổi hiện tại

**Đặc điểm:**
- Preview hiển thị tất cả thay đổi chưa lưu
- Có thể xem preview nhiều lần trong quá trình chỉnh sửa
- Preview bao gồm cả thống kê (lượt xem, lượt thích) từ bài viết gốc

## Tính năng của Dialog Preview

### Hiển thị đầy đủ
- **Header:** Tiêu đề + các badge (trạng thái, nổi bật)
- **Meta Information:** Tác giả, ngày tạo, danh mục, thống kê
- **Media:** Ảnh đại diện và video (nếu có)
- **Content Blocks:** Tất cả các block nội dung với định dạng đúng
- **Tags:** Danh sách các thẻ phân loại

### Định dạng nội dung
#### Text Block (Văn bản)
```
Hiển thị văn bản thông thường với line-height thoải mái
```

#### Heading Block (Tiêu đề)
```
Hiển thị tiêu đề từ H1 đến H6 với màu primary
Font-weight đậm và margin phù hợp
```

#### Image Block (Hình ảnh)
```
- Hình ảnh responsive, max-width 100%
- Border radius bo tròn
- Box shadow nhẹ
- Caption (nếu có) hiển thị dưới ảnh
```

#### Quote Block (Trích dẫn)
```
- Paper component với border màu primary bên trái
- Background màu nhạt
- Font style italic
- Tác giả và nguồn (nếu có) hiển thị bên phải
```

### Responsive
- Dialog có max-width: md (medium)
- Chiều cao tối đa 90vh với scroll
- Responsive trên mobile và desktop

## Tips sử dụng hiệu quả

1. **Trước khi lưu:** Luôn xem preview để đảm bảo nội dung hiển thị đúng
2. **Kiểm tra ảnh:** Đảm bảo URL ảnh hoạt động và hiển thị đúng
3. **Xem trên nhiều breakpoint:** Có thể resize trình duyệt để xem responsive
4. **Kiểm tra tags:** Đảm bảo tags hiển thị đầy đủ và đúng
5. **Xem trước trước khi xuất bản:** Đặc biệt quan trọng với bài viết sẽ gửi notification

## Lưu ý

- Preview chỉ là xem trước, không có chức năng chỉnh sửa
- Preview hiển thị dữ liệu hiện tại, chưa được lưu vào database
- Để đóng preview, nhấn nút "Đóng" hoặc click bên ngoài dialog
- Preview hỗ trợ cả định dạng content cũ (string/value) và mới (content property)

## Khắc phục sự cố

### Preview không hiển thị ảnh
- Kiểm tra URL ảnh có đúng không
- Đảm bảo URL có thể truy cập public
- Thử mở URL trực tiếp trên trình duyệt

### Content không hiển thị
- Đảm bảo đã nhập nội dung
- Kiểm tra type của content block có đúng không
- Xem console log để kiểm tra lỗi

### Dialog không mở
- Kiểm tra console log
- Thử refresh trang
- Đảm bảo đã có dữ liệu để preview

## Cập nhật code

### File đã thêm/chỉnh sửa:
1. **Mới:** `src/components/ContentPreview.tsx` - Component preview
2. **Cập nhật:** `src/pages/content/index.tsx` - Thêm preview vào danh sách
3. **Cập nhật:** `src/pages/content/create.tsx` - Thêm preview vào trang tạo
4. **Cập nhật:** `src/pages/content/edit/[id].tsx` - Thêm preview vào trang chỉnh sửa
