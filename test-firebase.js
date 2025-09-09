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

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    
    // Check current data structure
    const healthTipsRef = ref(database, 'health_tips');
    const snapshot = await get(healthTipsRef);
    
    console.log('health_tips exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('Existing data keys:', Object.keys(data));
    } else {
      console.log('No health_tips data found. Creating sample data...');
      
      // Create sample health tip
      const sampleTip = {
        title: 'Test Health Tip',
        content: 'This is a test health tip content...',
        summary: 'Test summary',
        category: 'Test Category',
        tags: ['test', 'health'],
        author: 'Admin',
        status: 'published',
        isFeature: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        viewCount: 0,
        likeCount: 0
      };
      
      const newTipRef = push(healthTipsRef);
      await set(newTipRef, sampleTip);
      console.log('Sample health tip created with ID:', newTipRef.key);
    }
    
    // Test getting data again
    const finalSnapshot = await get(healthTipsRef);
    if (finalSnapshot.exists()) {
      const data = finalSnapshot.val();
      console.log('Final data keys:', Object.keys(data));
      const firstItem = Object.values(data)[0];
      console.log('First item title:', firstItem.title);
    }
    
  } catch (error) {
    console.error('Firebase test error:', error);
  }
  
  process.exit(0);
}

testFirebase();
