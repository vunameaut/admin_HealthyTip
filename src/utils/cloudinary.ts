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
}

/**
 * Generate Cloudinary video URL with transformations
 */
export const getCloudinaryVideoUrl = (
  publicId: string, 
  options: CloudinaryTransformOptions = {}
) => {
  if (!publicId) return '';
  
  // Remove any existing cloudinary URLs if passed
  const cleanPublicId = publicId.replace(/^.*\/([^/]+)$/, '$1').replace(/\.[^.]*$/, '');
  
  const transformations = [];
  
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.effect) transformations.push(`e_${options.effect}`);
  
  const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : '';
  
  return `${CLOUDINARY_BASE_URL}/video/upload${transformString}/${cleanPublicId}.mp4`;
};

/**
 * Generate Cloudinary video thumbnail URL
 */
export const getCloudinaryVideoThumbnail = (
  publicId: string,
  options: CloudinaryTransformOptions = {}
) => {
  if (!publicId) return '';
  
  const cleanPublicId = publicId.replace(/^.*\/([^/]+)$/, '$1').replace(/\.[^.]*$/, '');
  
  const defaultOptions = {
    width: 400,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'jpg',
    ...options
  };
  
  const transformations = [
    `w_${defaultOptions.width}`,
    `h_${defaultOptions.height}`,
    `c_${defaultOptions.crop}`,
    `q_${defaultOptions.quality}`,
    `f_${defaultOptions.format}`,
    'fl_progressive',
    'so_0' // Get frame at 0 seconds
  ];
  
  if (defaultOptions.effect) transformations.push(`e_${defaultOptions.effect}`);
  
  return `${CLOUDINARY_BASE_URL}/video/upload/${transformations.join(',')}/${cleanPublicId}.jpg`;
};

/**
 * Generate Cloudinary image URL with transformations
 */
export const getCloudinaryImageUrl = (
  publicId: string,
  options: CloudinaryTransformOptions = {}
) => {
  if (!publicId) return '';
  
  const cleanPublicId = publicId.replace(/^.*\/([^/]+)$/, '$1').replace(/\.[^.]*$/, '');
  
  const defaultOptions = {
    quality: 'auto',
    format: 'auto',
    ...options
  };
  
  const transformations = [];
  
  if (defaultOptions.quality) transformations.push(`q_${defaultOptions.quality}`);
  if (defaultOptions.format) transformations.push(`f_${defaultOptions.format}`);
  if (defaultOptions.width) transformations.push(`w_${defaultOptions.width}`);
  if (defaultOptions.height) transformations.push(`h_${defaultOptions.height}`);
  if (defaultOptions.crop) transformations.push(`c_${defaultOptions.crop}`);
  if (defaultOptions.gravity) transformations.push(`g_${defaultOptions.gravity}`);
  if (defaultOptions.effect) transformations.push(`e_${defaultOptions.effect}`);
  
  const transformString = transformations.length > 0 ? `/${transformations.join(',')}` : '';
  
  return `${CLOUDINARY_BASE_URL}/image/upload${transformString}/${cleanPublicId}`;
};

/**
 * Upload video to Cloudinary using signed upload
 */
export const uploadVideoToCloudinary = async (
  file: File,
  options: {
    folder?: string;
    publicId?: string;
    onProgress?: (progress: number) => void;
  } = {}
): Promise<{
  public_id: string;
  secure_url: string;
  thumbnail_url: string;
  duration: number;
  width: number;
  height: number;
}> => {
  try {
    // Get upload signature from our API
    const signatureResponse = await fetch('/api/cloudinary/signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder: options.folder || 'health_videos',
        public_id: options.publicId,
      }),
    });

    if (!signatureResponse.ok) {
      throw new Error('Failed to get upload signature');
    }

    const { signature, timestamp, api_key, cloud_name, folder } = await signatureResponse.json();

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', api_key);
    formData.append('folder', folder);
    formData.append('resource_type', 'video');
    
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            options.onProgress!(progress);
          }
        });
      }
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            public_id: response.public_id,
            secure_url: response.secure_url,
            thumbnail_url: getCloudinaryVideoThumbnail(response.public_id),
            duration: response.duration || 0,
            width: response.width || 0,
            height: response.height || 0,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Get video info from Cloudinary
 */
export const getVideoInfo = async (publicId: string) => {
  try {
    const response = await fetch(
      `${CLOUDINARY_BASE_URL}/video/upload/${publicId}.json`
    );
    return await response.json();
  } catch (error) {
    console.error('Error getting video info:', error);
    return null;
  }
};

/**
 * Generate responsive video player embed
 */
export const generateVideoPlayer = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    poster?: string;
  } = {}
) => {
  const {
    width = 640,
    height = 360,
    controls = true,
    autoplay = false,
    muted = false,
    loop = false,
    poster
  } = options;
  
  const videoUrl = getCloudinaryVideoUrl(publicId, { 
    width, 
    height, 
    quality: 'auto' 
  });
  
  const thumbnailUrl = poster || getCloudinaryVideoThumbnail(publicId, {
    width,
    height
  });
  
  return {
    videoUrl,
    thumbnailUrl,
    embedProps: {
      width,
      height,
      controls,
      autoPlay: autoplay,
      muted,
      loop,
      poster: thumbnailUrl,
      preload: 'metadata'
    }
  };
};

export default {
  getCloudinaryVideoUrl,
  getCloudinaryVideoThumbnail,
  getCloudinaryImageUrl,
  uploadVideoToCloudinary,
  getVideoInfo,
  generateVideoPlayer
};
