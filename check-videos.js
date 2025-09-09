const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, push } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAXWk6glK6hpXQkiunvydjFNtM56yxwN_w",
  authDomain: "reminderwater-84694.firebaseapp.com",
  databaseURL: "https://reminderwater-84694-default-rtdb.firebaseio.com",
  projectId: "reminderwater-84694",
  storageBucket: "reminderwater-84694.appspot.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function checkVideos() {
  try {
    console.log('Checking videos in database...');
    
    // Check possible video paths
    const videosRef = ref(database, 'videos');
    const shortVideosRef = ref(database, 'short_videos');
    
    const [videosSnapshot, shortVideosSnapshot] = await Promise.all([
      get(videosRef),
      get(shortVideosRef)
    ]);
    
    console.log('videos exists:', videosSnapshot.exists());
    console.log('short_videos exists:', shortVideosSnapshot.exists());
    
    if (videosSnapshot.exists()) {
      const data = videosSnapshot.val();
      console.log('videos data keys:', Object.keys(data));
      console.log('First video:', Object.values(data)[0]);
    }
    
    if (shortVideosSnapshot.exists()) {
      const data = shortVideosSnapshot.val();
      console.log('short_videos data keys:', Object.keys(data));
      console.log('First short video:', Object.values(data)[0]);
    }
    
    if (!videosSnapshot.exists() && !shortVideosSnapshot.exists()) {
      console.log('No video data found. Creating sample video...');
      
      // Create sample video
      const sampleVideo = {
        title: 'Sample Health Video',
        caption: 'This is a sample health video',
        categoryId: 'health',
        status: 'published',
        videoUrl: 'https://sample-video-url.mp4',
        thumbnailUrl: 'https://sample-thumbnail-url.jpg',
        cloudinaryPublicId: 'sample-video-id',
        duration: 60,
        width: 1920,
        height: 1080,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        viewCount: 0,
        likeCount: 0,
        author: 'Admin'
      };
      
      const newVideoRef = push(videosRef);
      await set(newVideoRef, sampleVideo);
      console.log('Sample video created with ID:', newVideoRef.key);
    }
    
  } catch (error) {
    console.error('Error checking videos:', error);
  }
  
  process.exit(0);
}

checkVideos();
