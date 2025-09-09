const { getCloudinaryVideoUrl, getCloudinaryVideoThumbnail } = require('./src/utils/cloudinary');

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

// Test URL accessibility
const https = require('https');
const http = require('http');

function testUrl(url, name) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: 'HEAD' }, (res) => {
      console.log(`${name} Status:`, res.statusCode);
      resolve(res.statusCode);
    });
    
    req.on('error', (err) => {
      console.log(`${name} Error:`, err.message);
      resolve(null);
    });
    
    req.setTimeout(5000, () => {
      console.log(`${name} Timeout`);
      req.destroy();
      resolve(null);
    });
    
    req.end();
  });
}

async function testUrls() {
  await testUrl(videoUrl, 'Video URL');
  await testUrl(thumbnailUrl, 'Thumbnail URL');
  process.exit(0);
}

testUrls();
