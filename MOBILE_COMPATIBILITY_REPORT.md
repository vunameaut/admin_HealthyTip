# Báo Cáo Tương Thích Mobile App - Health Tips Data Structure

## 📋 Tổng Quan
Cấu trúc dữ liệu bài viết (HealthTip) trong web admin đã được cập nhật với format mới. Mobile app cần được điều chỉnh để tương thích với cấu trúc dữ liệu này.

## 🔄 Thay Đổi Cấu Trúc Dữ Liệu

### 1. **HealthTip Interface - Cấu Trúc Chính**
```typescript
interface HealthTip {
  id: string;
  title: string;
  content: ContentBlock[]; // ⚠️ THAY ĐỔI: Từ string thành ContentBlock[]
  categoryId: string;
  categoryName?: string;
  viewCount: number;
  likeCount: number;
  imageUrl?: string;
  createdAt: number;
  
  // ✅ CÁC TRƯỜNG MỚI ĐƯỢC THÊM:
  excerpt?: string;           // Tóm tắt bài viết
  status?: 'draft' | 'published' | 'archived' | 'review';
  tags?: string[];           // Mảng tags
  author?: string;           // Tác giả
  publishedAt?: number;      // Thời gian publish
  updatedAt?: number;        // Thời gian cập nhật cuối
  isFeature?: boolean;       // Bài viết nổi bật
  isPinned?: boolean;        // Bài viết được ghim
  seoTitle?: string;         // SEO title
  seoDescription?: string;   // SEO description
  scheduledAt?: number;      // Thời gian lên lịch
  slug?: string;             // URL slug
  isFavorite?: boolean;      // Yêu thích của user
  isLiked?: boolean;         // Đã like của user
}
```

### 2. **ContentBlock Interface - Cấu Trúc Nội Dung**
```typescript
interface ContentBlock {
  id: string;                              // ID duy nhất của block
  type: 'text' | 'image' | 'heading' | 'quote';  // Loại nội dung
  value: string;                           // Nội dung (text/URL ảnh)
  metadata?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;      // Cấp độ heading (H1-H6)
    alt?: string;                         // Alt text cho ảnh
    caption?: string;                     // Caption cho ảnh
  };
}
```

## 📱 Yêu Cầu Điều Chỉnh Mobile App

### 1. **Models/Data Classes Cần Cập Nhật**

#### **HealthTip Model**
```dart
// Flutter Example
class HealthTip {
  final String id;
  final String title;
  final List<ContentBlock> content;  // ⚠️ THAY ĐỔI: từ String thành List<ContentBlock>
  final String categoryId;
  final String? categoryName;
  final int viewCount;
  final int likeCount;
  final String? imageUrl;
  final int createdAt;
  
  // ✅ THÊM CÁC TRƯỜNG MỚI:
  final String? excerpt;
  final String? status;
  final List<String>? tags;
  final String? author;
  final int? publishedAt;
  final int? updatedAt;
  final bool? isFeature;
  final bool? isPinned;
  final String? seoTitle;
  final String? seoDescription;
  final int? scheduledAt;
  final String? slug;
  final bool? isFavorite;
  final bool? isLiked;
}
```

#### **ContentBlock Model**
```dart
// Flutter Example
class ContentBlock {
  final String id;
  final String type;  // 'text', 'image', 'heading', 'quote'
  final String value;
  final ContentMetadata? metadata;
}

class ContentMetadata {
  final int? level;    // 1-6 cho heading
  final String? alt;   // Alt text cho ảnh
  final String? caption; // Caption cho ảnh
}
```

### 2. **JSON Parsing Cần Cập Nhật**

#### **Cách Parse JSON Mới**
```dart
factory HealthTip.fromJson(Map<String, dynamic> json) {
  return HealthTip(
    id: json['id'] ?? '',
    title: json['title'] ?? '',
    
    // ⚠️ XỬ LÝ BACKWARD COMPATIBILITY
    content: _parseContent(json['content']),
    
    categoryId: json['categoryId'] ?? '',
    categoryName: json['categoryName'],
    viewCount: json['viewCount'] ?? 0,
    likeCount: json['likeCount'] ?? 0,
    imageUrl: json['imageUrl'],
    createdAt: json['createdAt'] ?? 0,
    
    // ✅ PARSE CÁC TRƯỜNG MỚI
    excerpt: json['excerpt'],
    status: json['status'],
    tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
    author: json['author'],
    publishedAt: json['publishedAt'],
    updatedAt: json['updatedAt'],
    isFeature: json['isFeature'] ?? false,
    isPinned: json['isPinned'] ?? false,
    seoTitle: json['seoTitle'],
    seoDescription: json['seoDescription'],
    scheduledAt: json['scheduledAt'],
    slug: json['slug'],
    isFavorite: json['isFavorite'] ?? false,
    isLiked: json['isLiked'] ?? false,
  );
}

// ⚠️ HÀM XỬ LÝ BACKWARD COMPATIBILITY
static List<ContentBlock> _parseContent(dynamic content) {
  if (content == null) return [];
  
  // Nếu là string (format cũ)
  if (content is String) {
    return [
      ContentBlock(
        id: 'legacy_${DateTime.now().millisecondsSinceEpoch}',
        type: 'text',
        value: content,
        metadata: null,
      )
    ];
  }
  
  // Nếu là array (format mới)
  if (content is List) {
    return content.map((item) => ContentBlock.fromJson(item)).toList();
  }
  
  return [];
}
```

### 3. **UI Components Cần Cập Nhật**

#### **Article Display Widget**
```dart
class ArticleContentWidget extends StatelessWidget {
  final List<ContentBlock> content;
  
  Widget build(BuildContext context) {
    return Column(
      children: content.map((block) => _buildContentBlock(block)).toList(),
    );
  }
  
  Widget _buildContentBlock(ContentBlock block) {
    switch (block.type) {
      case 'text':
        return _buildTextBlock(block);
      case 'image':
        return _buildImageBlock(block);
      case 'heading':
        return _buildHeadingBlock(block);
      case 'quote':
        return _buildQuoteBlock(block);
      default:
        return _buildTextBlock(block);
    }
  }
  
  Widget _buildTextBlock(ContentBlock block) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8.0),
      child: Text(
        block.value,
        style: TextStyle(fontSize: 16, lineHeight: 1.5),
      ),
    );
  }
  
  Widget _buildImageBlock(ContentBlock block) {
    return Column(
      children: [
        Image.network(block.value),
        if (block.metadata?.caption != null)
          Text(
            block.metadata!.caption!,
            style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey),
          ),
      ],
    );
  }
  
  Widget _buildHeadingBlock(ContentBlock block) {
    double fontSize = _getHeadingSize(block.metadata?.level ?? 1);
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 12.0),
      child: Text(
        block.value,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
  
  Widget _buildQuoteBlock(ContentBlock block) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 16.0),
      padding: EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderLeft: BorderSide(color: Colors.blue, width: 4),
      ),
      child: Text(
        block.value,
        style: TextStyle(fontStyle: FontStyle.italic),
      ),
    );
  }
  
  double _getHeadingSize(int level) {
    switch (level) {
      case 1: return 24.0;
      case 2: return 22.0;
      case 3: return 20.0;
      case 4: return 18.0;
      case 5: return 16.0;
      case 6: return 14.0;
      default: return 18.0;
    }
  }
}
```

## 🔧 Firebase Database Structure

### **Cấu Trúc Dữ Liệu Trong Firebase**
```json
{
  "healthTips": {
    "tip_id_1": {
      "id": "tip_id_1",
      "title": "Lợi ích của việc uống nước",
      "content": [
        {
          "id": "block_1_1697544000000",
          "type": "heading",
          "value": "Tại sao cần uống đủ nước?",
          "metadata": {
            "level": 2
          }
        },
        {
          "id": "block_2_1697544000001",
          "type": "text",
          "value": "Uống đủ nước mỗi ngày là một trong những thói quen quan trọng nhất..."
        },
        {
          "id": "block_3_1697544000002",
          "type": "image",
          "value": "https://res.cloudinary.com/example/image/upload/v123/health_tips/water.jpg",
          "metadata": {
            "alt": "Ly nước trong xanh",
            "caption": "Uống đủ 8 ly nước mỗi ngày"
          }
        },
        {
          "id": "block_4_1697544000003",
          "type": "quote",
          "value": "Nước là nguồn sống, hãy trân trọng từng giọt nước."
        }
      ],
      "categoryId": "nutrition",
      "categoryName": "Dinh Dưỡng",
      "viewCount": 1250,
      "likeCount": 45,
      "imageUrl": "https://example.com/cover.jpg",
      "createdAt": 1697544000000,
      "excerpt": "Khám phá những lợi ích tuyệt vời của việc uống đủ nước mỗi ngày",
      "status": "published",
      "tags": ["nước", "sức khỏe", "dinh dưỡng"],
      "author": "Dr. Nguyen Van A",
      "publishedAt": 1697544100000,
      "updatedAt": 1697544200000,
      "isFeature": true,
      "isPinned": false
    }
  }
}
```

## ⚠️ Lưu Ý Quan Trọng

### **1. Backward Compatibility**
- App cần xử lý được cả format cũ (content là string) và format mới (content là ContentBlock[])
- Đảm bảo app không crash khi gặp dữ liệu cũ

### **2. Error Handling**
- Xử lý trường hợp thiếu dữ liệu
- Fallback cho các trường optional
- Xử lý lỗi khi parse JSON

### **3. Performance**
- Cache ContentBlock đã render
- Lazy loading cho images
- Optimize việc parse JSON

### **4. UI/UX Considerations**
- Responsive design cho các loại content block
- Loading states cho images
- Proper typography cho headings
- Accessibility support

## 🚀 Migration Plan

### **Phase 1: Update Models**
1. Cập nhật HealthTip model
2. Tạo ContentBlock model
3. Cập nhật JSON parsing

### **Phase 2: Update UI**
1. Tạo ContentBlock rendering widgets
2. Cập nhật article display screens
3. Test với dữ liệu mới

### **Phase 3: Testing**
1. Test backward compatibility
2. Test performance với content phức tạp
3. Test UI trên các device sizes

### **Phase 4: Deployment**
1. Gradual rollout
2. Monitor crash rates
3. User feedback collection

---

**📅 Ngày tạo báo cáo:** September 17, 2025  
**🔄 Trạng thái:** Ready for Mobile Development  
**⚡ Độ ưu tiên:** HIGH - Cần implement để tương thích với web admin
