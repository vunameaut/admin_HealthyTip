// Cloudinary utilities for video and image optimization

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dazo6ypwt';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`;

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: string | number;
  format?: string;
  crop?: string;
  gravity?: string;
  effect?: string;
  startOffset?: number; // For video thumbnails
}

/**
 * Generate Cloudinary video URL with transformations
 */
export const getCloudinaryVideoUrl = (
  publicId: string, 
  options: CloudinaryTransformOptions = {}
): string => {
  if (!publicId) return '';
  
  // Remove any existing cloudinary URLs if passed
  const cleanPublicId = publicId.replace(/^.*\/([^/]+)$/, '$1').replace(/\.[^.]*$/, '');
  
  const transformations = [];
  
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.format) transformations.push(`f_${options.format}`);
  
  const transformStr = transformations.length > 0 ? `${transformations.join(',')}/` : '';
  return `${CLOUDINARY_BASE_URL}/video/upload/${transformStr}${cleanPublicId}.mp4`;
};

/**
 * Generate video thumbnail URL from video public_id
 */
export const generateVideoThumbnail = (
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string => {
  if (!publicId) return '';
  
  const cleanPublicId = publicId.replace(/^.*\/([^/]+)$/, '$1').replace(/\.[^.]*$/, '');
  const transformations = [];
  
  // Default thumbnail options
  transformations.push('so_' + (options.startOffset || 0)); // Start offset in seconds
  transformations.push(`w_${options.width || 400}`);
  transformations.push(`h_${options.height || 300}`);
  transformations.push(`c_${options.crop || 'fill'}`);
  transformations.push(`q_${options.quality || 'auto'}`);
  transformations.push(`f_${options.format || 'jpg'}`);
  
  const transformStr = transformations.join(',');
  return `${CLOUDINARY_BASE_URL}/video/upload/${transformStr}/${cleanPublicId}.jpg`;
};

/**
 * Generate image URL with transformations
 */
export const generateImageUrl = (
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string => {
  if (!publicId) return '';
  
  const cleanPublicId = publicId.replace(/^.*\/([^/]+)$/, '$1').replace(/\.[^.]*$/, '');
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.effect) transformations.push(`e_${options.effect}`);
  
  const transformStr = transformations.length > 0 ? `${transformations.join(',')}/` : '';
  return `${CLOUDINARY_BASE_URL}/image/upload/${transformStr}${cleanPublicId}`;
};

/**
 * Get folder path for upload based on category and date
 */
export const getFolderPath = (categoryName: string, date?: Date): string => {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Create slug from category name
  const categorySlug = categoryName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
  
  return `healthy_tip/${categorySlug}/${year}/${month}`;
};

/**
 * Validate file for upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (!isImage && !isVideo) {
    return { valid: false, error: 'Chỉ hỗ trợ file ảnh và video' };
  }
  
  // Check file size
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 100 * 1024 * 1024; // 100MB
  const maxSize = isVideo ? maxVideoSize : maxImageSize;
  
  if (file.size > maxSize) {
    const maxSizeText = isVideo ? '100MB' : '10MB';
    return { valid: false, error: `File quá lớn (tối đa ${maxSizeText})` };
  }
  
  // Check file format
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm', 'video/wmv', 'video/flv'];
  
  if (isImage && !allowedImageTypes.includes(file.type)) {
    return { valid: false, error: 'Định dạng ảnh không được hỗ trợ' };
  }
  
  if (isVideo && !allowedVideoTypes.includes(file.type)) {
    return { valid: false, error: 'Định dạng video không được hỗ trợ' };
  }
  
  return { valid: true };
};

/**
 * Extract public_id from Cloudinary URL
 */
export const extractPublicId = (cloudinaryUrl: string): string => {
  if (!cloudinaryUrl) return '';
  
  // Extract public_id from full Cloudinary URL
  const match = cloudinaryUrl.match(/\/(?:v\d+\/)?([^/.]+)(?:\.[^/]*)?$/);
  return match ? match[1] : '';
};

/**
 * Get video thumbnail from Cloudinary URL
 */
export const getCloudinaryVideoThumbnail = (videoUrl: string, options: CloudinaryTransformOptions = {}): string => {
  const publicId = extractPublicId(videoUrl);
  if (!publicId) return '';
  
  return generateVideoThumbnail(publicId, options);
};
