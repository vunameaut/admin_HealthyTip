// Copy of cloudinary utils for testing
const CLOUDINARY_CLOUD_NAME = 'dazo6ypwt';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}`;

const getCloudinaryVideoUrl = (publicId, options = {}) => {
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

const getCloudinaryVideoThumbnail = (publicId, options = {}) => {
  if (!publicId) return '';
  
  const cleanPublicId = publicId.replace(/^.*\/([^/]+)$/, '$1').replace(/\.[^.]*$/, '');
  
  const transformations = ['f_jpg', 'so_auto'];
  
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  
  const transformString = transformations.join(',');
  
  return `${CLOUDINARY_BASE_URL}/video/upload/${transformString}/${cleanPublicId}.jpg`;
};

// Test với video data thực tế từ database
const testVideoData = {
  cldPublicId: 'smoothie-xanh-detox_ooplld',
  title: 'Smoothie xanh detoxx'
};

console.log('Testing Cloudinary URLs...');
console.log('Public ID:', testVideoData.cldPublicId);

const videoUrl = getCloudinaryVideoUrl(testVideoData.cldPublicId, { quality: 'auto' });
const thumbnailUrl = getCloudinaryVideoThumbnail(testVideoData.cldPublicId);

console.log('Generated Video URL:', videoUrl);
console.log('Generated Thumbnail URL:', thumbnailUrl);

console.log('\nTesting URL format...');
console.log('Video URL valid:', videoUrl.includes('res.cloudinary.com') && videoUrl.includes('.mp4'));
console.log('Thumbnail URL valid:', thumbnailUrl.includes('res.cloudinary.com') && thumbnailUrl.includes('.jpg'));

// Test manual URL
const manualVideoUrl = `https://res.cloudinary.com/dazo6ypwt/video/upload/smoothie-xanh-detox_ooplld.mp4`;
console.log('\nManual Video URL:', manualVideoUrl);

process.exit(0);
